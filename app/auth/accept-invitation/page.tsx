import AcceptInvitationClient from "./accept-invitation-client";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string | string[] }>;
}) {
  const params = await searchParams;
  const invitationId = Array.isArray(params.invitationId) ? params.invitationId[0] : params.invitationId;
  return <AcceptInvitationClient invitationId={invitationId ?? ""} />;
}
