import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import _ from "lodash";
import type { NextPage } from "next";
import Head from "next/head";
import { useCallback, useMemo, useState } from "react";
import Header from "../components/Header";

const PRIVATE_IPS = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"];

export async function getStaticProps() {
  const queryClient = new QueryClient();

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

function Item(props: any) {
  const { sx, light, mask, ...other } = props;
  return (
    <Box
      sx={{
        p: 1,
        m: 0,
        bgcolor: mask
          ? light
            ? "#70d9e7"
            : "#35919d"
          : light
          ? "grey.100"
          : "grey.400",
        color: "grey.800",
        border: "1px solid",
        borderColor: "grey.300",
        borderRadius: 0,
        fontSize: "0.875rem",
        fontWeight: "700",
        minWidth: "2em",
        ...sx,
      }}
      {...other}
    />
  );
}

const numToIp = (num: number) => {
  const buff = new ArrayBuffer(4);
  const view = new DataView(buff);

  view.setUint32(0, num, false);

  return new Uint8Array(buff);
};

const useIpNum = (ip: Array<number>) => {
  return useMemo(() => {
    const arr = new Uint8Array(ip);
    const dataView = new DataView(arr.buffer);

    return dataView.getUint32(0, false);
  }, [ip]);
};

function NetworkButton({
  net,
  setNetwork,
}: {
  net: string;
  setNetwork: (n: string) => any;
}) {
  return (
    <Button
      sx={{ justifyContent: "start" }}
      onClick={setNetwork.bind(undefined, net)}
    >
      {net}
    </Button>
  );
}

function IpSegment({
  value,
  onChange,
}: {
  value: number;
  onChange: (e: any) => void;
}) {
  return (
    <TextField
      type="number"
      inputProps={{ min: 0, max: 255, style: { textAlign: "center" } }}
      InputProps={{ disableUnderline: true }}
      sx={{ flexGrow: 1 }}
      variant="standard"
      value={value}
      onChange={onChange}
    />
  );
}

function Cidr({
  value,
  onChange,
}: {
  value: number;
  onChange: (e: any) => void;
}) {
  return (
    <TextField
      type="number"
      inputProps={{ min: 0, max: 32, style: { textAlign: "center" } }}
      InputProps={{ disableUnderline: true }}
      variant="standard"
      value={value}
      onChange={onChange}
    />
  );
}

const Home: NextPage = () => {
  const [enableCidr, setEnableCidr] = useState(false);
  const [cidr, setCidr] = useState(0);
  const [ip, setIp] = useState([0, 0, 0, 0]);

  const setNetwork = useCallback((net: string) => {
    const a = net.split(/[./]/);
    setIp(a.slice(0, 4).map((i) => parseInt(i, 10)));
    setCidr(parseInt(a[4], 10));
  }, []);

  const ipNum = useIpNum(ip);

  const mask = useMemo(
    () => (cidr && !(cidr % 32) ? -1 : ~(-1 >>> cidr)),
    [cidr]
  );

  const lowBlockNum = useMemo(() => (ipNum & mask) >>> 0, [ipNum, mask]);
  const highBlockNum = useMemo(() => (ipNum | ~mask) >>> 0, [ipNum, mask]);

  const ipSegmentHandler = (i: number) => (e: Event) => {
    setIp((ip) => [
      ...ip.slice(0, i),
      parseInt(_.get(e.target, "value", 0)),
      ...ip.slice(i + 1),
    ]);
  };

  return (
    <>
      <Head>
        <title>IP Visualizer</title>
        <meta name="description" content="Interactive IP Address Demo" />
      </Head>
      <Container maxWidth="xl">
        <Header />
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={enableCidr}
                onChange={(e) => setEnableCidr(e.target.checked)}
              />
            }
            label="Classless Inter-Domain Routing (CIDR)"
          />
          <Button
            color="error"
            onClick={() => {
              setIp([0, 0, 0, 0]);
              setCidr(0);
            }}
          >
            Reset
          </Button>
        </Box>
        <Grid container>
          <Grid item xs={10}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                alignItems: "baseline",
              }}
            >
              <IpSegment value={ip[0]} onChange={ipSegmentHandler(0)} />.
              <IpSegment value={ip[1]} onChange={ipSegmentHandler(1)} />.
              <IpSegment value={ip[2]} onChange={ipSegmentHandler(2)} />.
              <IpSegment value={ip[3]} onChange={ipSegmentHandler(3)} />
            </Box>
          </Grid>
          <Grid item xs={2}>
            {enableCidr && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "baseline",
                }}
              >
                /
                <Cidr
                  value={cidr}
                  onChange={(e) => setCidr(parseInt(e.target.value))}
                />
              </Box>
            )}
          </Grid>
          <Grid item xs={10}>
            <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
              {_.map(ipNum.toString(2).padStart(32, "0"), (d, i) => (
                <Item
                  key={i}
                  light={Math.floor(i / 8) % 2 === 0}
                  mask={enableCidr && i < cidr}
                  sx={{ flexGrow: 1, flexBasis: "2em", textAlign: "center" }}
                >
                  {d}
                </Item>
              ))}
            </Box>
          </Grid>
          <Grid item xs={4} sx={{ m: 1 }}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      32-bit integer
                    </TableCell>
                    <TableCell align="right">{ipNum}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Hex
                    </TableCell>
                    <TableCell align="right">
                      {ip.map((s) => s.toString(16).padStart(2, "0")).join(" ")}
                    </TableCell>
                  </TableRow>
                  {enableCidr && (
                    <>
                      <TableRow>
                        <TableCell component="th" scope="row">
                          Number of IPs in CIDR block
                        </TableCell>
                        <TableCell align="right">
                          {Math.pow(2, 32 - cidr)} (
                          {Math.pow(2, 32 - cidr).toExponential(2)})
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">
                          Lowest IP
                        </TableCell>
                        <TableCell align="right">
                          {numToIp(lowBlockNum).join(".")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">
                          Highest IP (Broadcast IP)
                        </TableCell>
                        <TableCell align="right">
                          {numToIp(highBlockNum).join(".")}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          {enableCidr && (
            <>
              <Grid item xs={12}>
                <Box>Loopback Addresses</Box>
                <Box>
                  <NetworkButton net={"127.0.0.0/8"} setNetwork={setNetwork} />
                </Box>
                <Box>Private Addresses</Box>
                <Box>
                  <ButtonGroup orientation="vertical" variant="text">
                    {PRIVATE_IPS.map((p) => (
                      <NetworkButton key={p} net={p} setNetwork={setNetwork} />
                    ))}
                  </ButtonGroup>
                </Box>
                <Box>Multi-cast Addresses</Box>
                <Box>
                  <NetworkButton net={"224.0.0.0/4"} setNetwork={setNetwork} />
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default Home;
