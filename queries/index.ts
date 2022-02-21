import _ from "lodash";

const ROOT_SERVER_A = "198.41.0.4";

export const getIp = () => fetch("/api/hello").then((resp) => resp.json());

export const getDNSQuery = async ({
  hostname,
  type = 1,
  server = ROOT_SERVER_A,
}: {
  hostname: string;
  type?: number;
  server?: string;
}): Promise<Array<any>> => {
  const resp = await fetch("/api/resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hostname,
      type,
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
      return [
        resp,
        ...(await getDNSQuery({
          hostname,
          type,
          server: nsAdditional.data,
        })),
      ];
    } else {
      const nsQuery = await getDNSQuery({
        hostname: ns.data,
        type: 1,
        server: ROOT_SERVER_A,
      });
      const nsAddrAnswers = _.get(nsQuery, [nsQuery.length - 1, "answers"]);
      const nsAddrAnswer = _.find(nsAddrAnswers, (a) => a.type === 1);

      return [
        resp,
        ..._.map(nsQuery, (q) => ({...q, intermediate: true})),
        ...(await getDNSQuery({
          hostname,
          type,
          server: nsAddrAnswer.data,
        })),
      ];
    }
  }

  return [resp];
};
