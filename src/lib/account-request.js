export async function accountRequest(path, body) {
  const options = body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const response = await fetch("/api/account/" + path, options);
  const value = await response.json();
  if (!response.ok) {
    const error = new Error(value.error || "账号服务暂时不可用。");
    error.status = response.status;
    throw error;
  }
  return value;
}
