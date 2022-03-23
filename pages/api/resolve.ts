import { Buffer } from "buffer";
import { randomBytes } from "crypto";
import dgram from "dgram";
import _ from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

function hostToQuestion(host: string, type: number = 1) {
  if (host && type !== 12 && !host.endsWith(".")) {
    host += ".";
  }

  const h = host.trim().split(".");

  if (host && type === 12) {
    h.reverse();
    h.push("in-addr", "arpa", "");
  }

  const result = [];

  for (let s of h) {
    result.push(Buffer.alloc(1, s.length), Buffer.from(s)); // size, label
  }

  result.push(Buffer.from([0, type, 0, 1])); // type IN
  return Buffer.concat(result);
}

function sendUdp(address: string, port: number, data: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    const client = dgram.createSocket("udp4");

    client.on("message", (msg, info) => {
      resolve(msg);
      client.close();
    });

    client.on("error", (err) => {
      reject(err);
      client.close();
    });

    client.send(data, port, address);
  });
}

function getName(buff: Buffer, offset: number): [string, number] {
  let i = offset;
  const labels = [];
  while (true) {
    let j = buff[i++];
    const isPointer = (j & 0xc0) !== 0;
    j &= 0x3f;

    if (isPointer) {
      let p = buff.readUint16BE(i - 1) & ~0xc000;
      const [label] = getName(buff, p);
      labels.push(label);
      i++;
      break;
    }

    if (!j) {
      labels.push("");
      break;
    }
    labels.push(buff.toString("utf8", i, i + j));
    i += j;
  }

  return [labels.join("."), i];
}

const handleType: { [key: number]: (buff: Buffer, offset: number) => any } = {
  1: (buff, offset) => {
    // A
    return new Uint8Array(buff.subarray(offset, offset + 4)).join(".");
  },
  2: (buff, offset) => getName(buff, offset)[0], // NS
  6: (buff, offset) => {
    // SOA
    let i = offset;
    let mname, rname;
    [mname, i] = getName(buff, i);
    [rname, i] = getName(buff, i);
    return {
      mname,
      rname,
      serial: buff.readUint32BE(i),
    };
  },
  12: (buff, offset) => getName(buff, offset)[0], // PTR
  28: (buff, offset) => {
    // AAAA
    const hex = buff.subarray(offset, offset + 16).toString("hex");
    return _.range(0, 32, 4)
      .map((i) => hex.slice(i, i + 4))
      .join(":");
  },
};

async function queryDNS(
  host: string,
  name: string,
  qType: number = 1,
  port: number = 53
) {
  const id = randomBytes(2);
  const queryOpt = Buffer.from("0100", "hex");
  const queryCount = Buffer.from([0, 1]);
  const answerCounts = Buffer.alloc(6, 0); // not needed for query
  const question = hostToQuestion(name, qType);

  const query = Buffer.concat([
    id,
    queryOpt,
    queryCount,
    answerCounts,
    question,
  ]);

  const msg = await sendUdp(host, port, query);

  console.assert(msg.subarray(0, 2).equals(id), "ids should match");

  const rcode = msg.readUint16BE(2) & 0x0f;

  const queries = [];

  const answers = [];
  const authority = [];
  const additional = [];

  let i = 12;

  // get questions
  for (let qdCount = msg.readUint16BE(4); qdCount > 0; qdCount--) {
    let name;
    [name, i] = getName(msg, i);

    queries.push({ name, type: msg.readUint16BE(i) });
    i += 4;
  }

  for (let anCount = msg.readUint16BE(6); anCount > 0; anCount--) {
    let name;
    [name, i] = getName(msg, i);

    const len = msg.readUint16BE(i + 8);
    const type = msg.readUint16BE(i);
    const ttl = msg.readUint32BE(i + 4);
    const data = handleType[type](msg, i + 10);

    i += 10 + len;

    answers.push({
      name,
      type,
      ttl,
      data,
    });
  }

  for (let nsCount = msg.readUint16BE(8); nsCount > 0; nsCount--) {
    let name;
    [name, i] = getName(msg, i);

    const type = msg.readUint16BE(i);
    console.assert(type === 2, "should be NS record");
    const ttl = msg.readUint32BE(i + 4);
    const len = msg.readUint16BE(i + 8);
    const data = handleType[type](msg, i + 10);

    i += 10 + len;

    authority.push({
      name,
      type,
      ttl,
      data,
    });
  }

  for (let arCount = msg.readUint16BE(10); arCount > 0; arCount--) {
    let name;
    [name, i] = getName(msg, i);

    const type = msg.readUint16BE(i);
    const ttl = msg.readUint32BE(i + 4);
    const len = msg.readUint16BE(i + 8);

    const data = handleType[type](msg, i + 10);
    i += 10 + len;

    additional.push({
      name,
      type,
      ttl,
      data,
    });
  }

  return {
    id: id.toString("hex"),
    queries,
    answers,
    authority,
    additional,
    server: host,
    rcode,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { hostname, server = "198.41.0.4", type = 1 } = req.body;
  try {
    res.status(200).json(await queryDNS(server, hostname, type));
  } catch (e) {
    res.status(400).json({ message: e });
  }
}
