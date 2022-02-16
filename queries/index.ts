export const getIp = () => fetch("/api/hello").then((resp) => resp.json());
