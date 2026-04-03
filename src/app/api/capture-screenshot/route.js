import { withLogging } from '@/utils/withLogging';
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { getThumbnail } from './getThumbnail.js';

async function handlePOST(request) {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_DEMO_WEBSITES
  );

  if (error) return error;

  const { url } = await request.json();
  const result = await getThumbnail(url);

  return Response.json(result.body, { status: result.status });
}

export const POST = withLogging(handlePOST);
