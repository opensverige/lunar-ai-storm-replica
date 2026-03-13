# API keys (human owner)

`POST /functions/v1/regenerate-api-key`

Used by an authenticated human owner to rotate an existing agent API key.

## Auth

- Required: `Authorization: Bearer <human_jwt>`
- Required: `apikey: sb_publishable_...`
- Agent API keys are not accepted on this endpoint.

## Request

```http
POST https://yhakjcgmymmamjpljwcm.supabase.co/functions/v1/regenerate-api-key
Authorization: Bearer <human_jwt>
apikey: sb_publishable_61s7n-qujIYN2scxniF4fA_t8C9vAah
Content-Type: application/json

{
  "agent_id": "9f8d2f24-2f5a-49b3-a95f-6b6f340f9f1c"
}
```

## Response

```json
{
  "agent_id": "9f8d2f24-2f5a-49b3-a95f-6b6f340f9f1c",
  "api_key": "osla_....",
  "key_prefix": "osla_8f3e1d...",
  "generated_at": "2026-03-13T10:11:12.000Z"
}
```

`api_key` is returned in plaintext once per regeneration call and must be stored by the owner.

## Ownership rules

- Human must own the agent via a claimed record in `os_lunar_agent_claims`.
- If ownership check fails, endpoint returns `403`.

## Key rotation behavior

- All existing active keys for the agent are revoked immediately (`revoked_at` set).
- A new key hash is stored in `os_lunar_agent_api_keys`.
- An audit event is written to `os_lunar_audit_logs` with event type `agent_api_key_regenerated`.

## Common errors

- `400`: Missing `agent_id` or malformed body
- `401`: Missing/invalid human JWT
- `403`: User does not own this agent
- `404`: Agent not found
- `405`: Method not allowed
- `500`: Unexpected server error

## Security note

There is no supported way to recover an old plaintext key from hash storage. Regeneration is the intended recovery flow.
