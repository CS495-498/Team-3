import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { fileTypeFromBuffer } from "file-type";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import { sanitizeHtmlServer } from "@/lib/featureRequests/requests/sanitizeHtmlServer.js";
import { withLogging } from '@/utils/withLogging';

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

async function handleGet(request) {
  const supabase = await createClient();

  const { error2, profile } = await requireAuthWithPermission(
    PERMISSIONS.VIEW_CONTENT
  );

  if (error2) return error2;

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "6", 10);
  const statusFilter = searchParams.get("status") || "";
  const showCompleted = searchParams.get("showCompleted") === "true";
  const sort = searchParams.get("sort") || "votes_desc";
  const userSearch = searchParams.get("user") || "";

  try {
    // Build base query
    let query = supabase
      .from("feature_requests")
      .select(`
        *,
        profiles!fk_feature_requests_author (
          username,
          full_name
        )
      `, { count: "exact" });

    // Apply status filter
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    } else if (!showCompleted) {
      query = query.neq("status", "completed");
    }

    // Apply user search via profile ID lookup
    if (userSearch) {
      const { data: matchingProfiles } = await supabase
        .from("profiles")
        .select("id")
        .or(`username.ilike.%${userSearch}%,full_name.ilike.%${userSearch}%`);

      const profileIds = (matchingProfiles || []).map((p) => p.id);
      if (profileIds.length === 0) {
        return NextResponse.json({
          featureRequests: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        });
      }
      query = query.in("user_id", profileIds);
    }

    // For vote-based sorts, we need all filtered IDs to compute vote counts
    const isVoteSort = sort === "votes_desc" || sort === "votes_asc";

    let pageData;
    let totalCount;

    if (isVoteSort) {
      // Fetch all filtered requests (only IDs + minimal data)
      const { data: allFiltered, count, error } = await query;
      if (error) {
        console.error("FEATURE REQUEST API ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      totalCount = count || 0;
      const allIds = (allFiltered || []).map((r) => r.id);

      // Compute vote counts in a single query
      let voteCounts = {};
      if (allIds.length > 0) {
        const { data: voteRows } = await supabase
          .from("votes")
          .select("req_id, Upvoted")
          .in("req_id", allIds);

        (voteRows || []).forEach((v) => {
          if (!voteCounts[v.req_id]) voteCounts[v.req_id] = 0;
          voteCounts[v.req_id] += v.Upvoted ? 1 : -1;
        });
      }

      // Attach vote counts and sort
      const withVotes = (allFiltered || []).map((r) => ({
        ...r,
        number_of_votes: voteCounts[r.id] || 0,
      }));

      withVotes.sort((a, b) =>
        sort === "votes_desc"
          ? b.number_of_votes - a.number_of_votes
          : a.number_of_votes - b.number_of_votes
      );

      // Paginate the sorted result
      const from = (page - 1) * limit;
      pageData = withVotes.slice(from, from + limit);
    } else {
      // For non-vote sorts, use Supabase ordering + range directly
      switch (sort) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "title_asc":
          query = query.order("title", { ascending: true });
          break;
        case "title_desc":
          query = query.order("title", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.error("FEATURE REQUEST API ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      totalCount = count || 0;
      pageData = data || [];
    }

    // Enrich the page slice with vote counts, comment counts, user vote state, signed URLs
    const pageIds = pageData.map((r) => r.id);

    if (pageIds.length === 0) {
      return NextResponse.json({
        featureRequests: [],
        total: totalCount,
        page,
        limit,
        hasMore: false,
      });
    }

    // Run all enrichment queries in parallel for speed
    const supabaseServiceRole = await createServiceRoleClient();

    const [voteCountResult, commentResult, userVoteResult, ...signedUrlResults] = await Promise.all([
      // Vote counts (skip if already computed for vote sort)
      isVoteSort
        ? Promise.resolve({ data: null })
        : supabase.from("votes").select("req_id, Upvoted").in("req_id", pageIds),
      // Comment counts
      supabase.from("feature_request_comments").select("feature_request_id").in("feature_request_id", pageIds),
      // Current user's vote state
      profile?.id
        ? supabase.from("votes").select("req_id, Upvoted").eq("user_id", profile.id).in("req_id", pageIds)
        : Promise.resolve({ data: null }),
      // Signed file URLs (one per page item)
      ...pageData.map((req) =>
        req.file_url
          ? supabaseServiceRole.storage.from("feature-uploads").createSignedUrl(req.file_url, 60 * 60)
          : Promise.resolve({ data: null })
      ),
    ]);

    // Process vote counts
    let voteCounts = {};
    if (!isVoteSort) {
      (voteCountResult.data || []).forEach((v) => {
        if (!voteCounts[v.req_id]) voteCounts[v.req_id] = 0;
        voteCounts[v.req_id] += v.Upvoted ? 1 : -1;
      });
    }

    // Process comment counts
    const commentCounts = {};
    (commentResult.data || []).forEach((c) => {
      commentCounts[c.feature_request_id] = (commentCounts[c.feature_request_id] || 0) + 1;
    });

    // Process user vote state
    const userVoteMap = {};
    (userVoteResult.data || []).forEach((v) => {
      userVoteMap[v.req_id] = v.Upvoted ? "up" : "down";
    });

    // Build enriched response
    const enriched = pageData.map((req, i) => {
      const urlResult = signedUrlResults[i];
      const signedFileUrl = urlResult?.data?.signedUrl || null;
      if (req.file_url && urlResult?.error) {
        console.error("Signed URL error:", urlResult.error);
      }

      return {
        ...req,
        username: req.profiles?.username || null,
        full_name: req.profiles?.full_name || null,
        signed_file_url: signedFileUrl,
        number_of_votes: isVoteSort ? req.number_of_votes : (voteCounts[req.id] || 0),
        commentCount: commentCounts[req.id] || 0,
        currentUserVote: userVoteMap[req.id] || null,
      };
    });

    const from = (page - 1) * limit;
    const hasMore = from + enriched.length < totalCount;

    return NextResponse.json({
      featureRequests: enriched,
      total: totalCount,
      page,
      limit,
      hasMore,
    });
  } catch (err) {
    console.error("GET /api/feature-requests paginated error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function handlePost(req) {
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

export const GET = withLogging(handleGet);
export const POST = withLogging(handlePost);
