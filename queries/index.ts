import _ from "lodash";

const ROOT_SERVER_A = "198.41.0.4";

export const getIp = () => fetch("/api/hello").then((resp) => resp.json());

export const getDNSQuery = async (
  hostname: string,
  server: string = ROOT_SERVER_A
): Promise<Array<any>> => {
  const resp = await fetch("/api/resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hostname,
      server,
    }),
  }).then((resp) => resp.json());

  if (!resp.answers.length && resp.authority.length && resp.rcode === 0) {
    const ns = _.find(resp.authority, (a) => a.type === 2);

    if (!ns) {
      return [resp];
    }

    const nsAdditional = _.find(
      resp.additional,
      (a) => a.name === ns.data && a.type === 1
    );
    if (nsAdditional) {
      return [resp, ...(await getDNSQuery(hostname, nsAdditional.address))];
    } else {
      const nsQuery = await getDNSQuery(ns.data, ROOT_SERVER_A);
      const nsAddrAnswers = _.get(nsQuery, [nsQuery.length - 1, "answers"]);
      const nsAddrAnswer = _.find(nsAddrAnswers, (a) => a.type === 1);

      return [
        resp,
        // ...nsQuery,
        ...(await getDNSQuery(hostname, nsAddrAnswer.address)),
      ];
    }
  }

  return [resp];
};
