import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import {NextResponse} from "next/server";
import {createClient} from "@/utils/Supabase/server";
import {fileTypeFromBuffer} from "file-type";
import {createServiceRoleClient} from "@/utils/Supabase/server";
import { sanitizeHtmlServer } from "@/lib/featureRequests/requests/sanitizeHtmlServer.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/ogg"
];

const TITLE_MAX_LENGTH = 100;


const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function GET() {
  const supabase = await createClient();

  const { error2, profile } = await requireAuthWithPermission(

    PERMISSIONS.VIEW_CONTENT
  );

  if (error2) return error2;

    const { data, error } = await supabase
        .from("feature_requests")
        .select(`
      *,
      profiles!fk_feature_requests_author (
        username,
        full_name
      )
    `)
        .order("created_at", { ascending: false });

  if (error) {
    console.error("FEATURE REQUEST API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    const requestIds = data.map((req) => req.id).filter(Boolean);
    let votesByRequest = {};
    let voterProfileMap = {};

    if (requestIds.length > 0) {
        const { data: voteRows, error: votesError } = await supabase
            .from("votes")
            .select("req_id, user_id")
            .in("req_id", requestIds);

        if (votesError) {
            console.error("Votes lookup error:", votesError);
        } else if (voteRows?.length) {
            const uniqueVoterIds = [...new Set(voteRows.map((v) => v.user_id).filter(Boolean))];

            if (uniqueVoterIds.length > 0) {
                const { data: voterProfiles, error: voterProfilesError } = await supabase
                    .from("profiles")
                    .select("id, username, full_name")
                    .in("id", uniqueVoterIds);

                if (voterProfilesError) {
                    console.error("Voter profiles lookup error:", voterProfilesError);
                } else {
                    voterProfileMap = (voterProfiles || []).reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
            }

            votesByRequest = voteRows.reduce((acc, vote) => {
                if (!vote?.req_id) return acc;
                if (!acc[vote.req_id]) acc[vote.req_id] = [];
                const voterProfile = voterProfileMap[vote.user_id];
                if (voterProfile) acc[vote.req_id].push(voterProfile);
                return acc;
            }, {});
        }
    }

    const supabaseServiceRole = await createServiceRoleClient();

  // Attach signed URLs
  const enriched = await Promise.all(
    data.map(async (req) => {
      const requestVoters = votesByRequest[req.id] || [];
      let signedFileUrl = null;

      if (req.file_url) {
          const { data: urlData, error: urlError } =
              await supabaseServiceRole.storage
                  .from("feature-uploads")
                  .createSignedUrl(req.file_url, 60 * 60);

          if (urlError) {
              console.error("Signed URL error:", urlError);
          } else {
              signedFileUrl = urlData.signedUrl;
          }
      }

      return {
        ...req,
        username: req.profiles?.username || null,
        full_name: req.profiles?.full_name || null,
        voter_usernames: requestVoters
            .map((v) => v.username)
            .filter(Boolean),
        voter_full_names: requestVoters
            .map((v) => v.full_name)
            .filter(Boolean),
        signed_file_url: signedFileUrl,
      };
    })
  );

    return NextResponse.json(enriched, { status: 200 });
}

export async function POST(req) {
    const supabase = await createClient();

    const { error2, profile } = await requireAuthWithPermission(

    PERMISSIONS.PUBLISH_FEATURE_REQUESTS
  );

    if (error2) return error2;

    const contentLength = req.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

    const formData = await req.formData();
    const title = formData.get("title");
    const content = formData.get("content");
    const file = formData.get("file");

    const normalizedTitle = title?.toString().trim() || "";

    if (!normalizedTitle) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
        return NextResponse.json(
            { error: `Title cannot exceed ${TITLE_MAX_LENGTH} characters` },
            { status: 400 }
        );
    }

    const cleanContent = sanitizeHtmlServer(content)

    let filePath = null;

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

        const buffer = Buffer.from(await file.arrayBuffer());

    // Detect actual file type
    const detectedType = await fileTypeFromBuffer(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    filePath = `uploads/${crypto.randomUUID()}.${detectedType.ext}`;

        const { error: uploadError } = await supabase.storage
            .from("feature-uploads")
            .upload(filePath, buffer, {
                contentType: detectedType.mime,
                upsert: false
            });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
  }

    const { data, error } = await supabase
        .from("feature_requests")
        .insert([
            {
                title: normalizedTitle,
                content: cleanContent,
                status: "open",
                user_id: profile.id,
                file_url: filePath
            }
        ])
        .select(`
      *,
      user:profiles!fk_feature_requests_author (
        username
      )
    `)
        .single();

  if (error) {
    console.error("Feature request insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = {
    ...data,
    username: data.user.username,
    commentCount: 0
  };

    return NextResponse.json(response, { status: 201 });
}
