import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import _ from "lodash";
import Head from "next/head";
import NextLink from "next/link";
import type { SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "react-flow-renderer";
import { getDNSQuery } from "../queries";

const typeMap: { [key: number]: string } = {
  1: "A",
  2: "NS",
  12: "PTR",
};

interface Query {
  name: string;
  type: number;
}

interface Answer {
  name: string;
  type: number;
  data: string;
}

const onLoad = (reactFlowInstance: any) => reactFlowInstance.fitView();

function DNSFlow({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onLoad={onLoad}
      snapToGrid
      fitView
      snapGrid={[15, 15]}
    >
      <MiniMap />
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
}

function AuthorityNode({ resp }: { resp: any }) {
  const authority: any = _.head(resp.authority);

  if (authority.type === 6) {
    return (
      <div>
        <div>Authority: {authority.name} IN SOA</div>
        <div>Primary Name Server: {authority.data.mname}</div>
        <div>Mailbox: {authority.data.rname}</div>
      </div>
    );
  }

  if (authority.type !== 2) {
    return null;
  }

  const additional = _.find(
    resp.additional,
    (a) => a.type === 1 && a.name === authority.data
  );

  return (
    <div>
      <div>
        Authority: {authority.name} IN NS {authority.data}
      </div>
      {additional && (
        <div>
          Additional: {additional.name} IN A {additional.data}
        </div>
      )}
    </div>
  );
}

function AnswerNode({ resp }: { resp: any }) {
  const answer = _.head(resp.answers) as Answer;
  return (
    <div>
      Answer: {answer.name} IN {typeMap[answer.type]} {answer.data}
    </div>
  );
}

function useFlow(result: any[], showIntermediate: boolean = false) {
  return useMemo<[any[], any[]]>(() => {
    if (!result.length) {
      return [[], []];
    }
    return _.reduce(
      _.filter(result, (resp) => showIntermediate || !resp.intermediate),
      ([nodes, edges], resp, i, r) => {
        const query: Query | undefined = _.head(resp.queries);
        nodes.push(
          {
            id: resp.id + "-query",
            type: i ? "default" : "input",
            sourcePosition: "right",
            targetPosition: "right",
            style: {
              background: resp.intermediate ? "#eee" : "white",
            },
            data: {
              label: query
                ? `${query.name} IN ${typeMap[query.type]}`
                : "invalid hostname",
            },
            position: { x: 250, y: i * 90 },
          },
          {
            id: `${resp.id}-answer`,
            type: i === r.length - 1 ? "output" : "default",
            sourcePosition: "left",
            targetPosition: "left",
            style: {
              minWidth: "30em",
              background: resp.rcode
                ? "rgba(255,0,0,0.36)"
                : resp.intermediate
                ? "#eee"
                : "white",
            },
            data: {
              label: (
                <div>
                  <div>Server: {resp.server}</div>
                  {resp.authority.length ? <AuthorityNode resp={resp} /> : null}
                  {resp.answers.length ? <AnswerNode resp={resp} /> : null}
                  {resp.rcode ? <div>Error code {resp.rcode}</div> : null}
                </div>
              ),
            },
            position: { x: 500, y: i * 90 + 30 },
          }
        );

        edges.push({
          id: `${resp.id}-edge`,
          source: `${resp.id}-query`,
          target: `${resp.id}-answer`,
          arrowHeadType: "arrowclosed",
        });

        if (i > 0) {
          edges.push({
            id: `${resp.id}-in-edge`,
            source: `${r[i - 1].id}-answer`,
            target: `${resp.id}-query`,
            arrowHeadType: "arrowclosed",
          });
        }

        return [nodes, edges];
      },
      [[], []] as any
    );
  }, [result, showIntermediate]);
}

function DNS() {
  const [hostname, setHostname] = useState<string>("");
  const [reverse, setReverse] = useState<boolean>(false);
  const [result, setResult] = useState<Array<any>>([]);
  const [showIntermediate, setShowIntermediate] = useState<boolean>(false);

  const [nodes, edges] = useFlow(result, showIntermediate);

  const onSubmit = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      getDNSQuery({ hostname, type: reverse ? 12 : 1 }).then(setResult);
    },
    [hostname, reverse]
  );

  const onReset = useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    setHostname("");
    setResult([]);
  }, []);

  return (
    <>
      <Head>
        <title>DNS Visualizer</title>
        <meta name="description" content="Interactive DNS Demo" />
      </Head>
      <Container maxWidth="xl">
        <Box sx={{ m: 1 }}>
          <NextLink href="/" passHref>
            <Link>IP Things here</Link>
          </NextLink>
        </Box>
        <Box>
          <form action="" onSubmit={onSubmit} onReset={onReset}>
            <Box>
              <FormControl>
                <Input
                  placeholder="hostname"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                />
              </FormControl>
              <Button type="submit">Query</Button>
              <Button color="error" type="reset">
                Reset
              </Button>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reverse}
                    onChange={(e) => setReverse(e.target.checked)}
                  />
                }
                label="Reverse"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showIntermediate}
                    onChange={(e) => setShowIntermediate(e.target.checked)}
                  />
                }
                label="Show Intermediate Queries"
              />
            </Box>
          </form>
        </Box>
        <Box sx={{ height: "70vh" }}>
          <DNSFlow nodes={nodes} edges={edges} />
        </Box>
      </Container>
    </>
  );
}

export default DNS;
