import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import _ from "lodash";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { dehydrate, QueryClient, useQuery } from "react-query";
import { getIp } from "../queries";

export async function getStaticProps() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery("ip", getIp);

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

const numToIp = (num: number) => {
  const ip = [];

  for (let i of _.range(4)) {
    ip.unshift(num & 255);
    num >>>= 8;
  }

  return ip;
};

const Home: NextPage = () => {
  const [enableCidr, setEnableCidr] = useState(false);
  const [cidr, setCidr] = useState(0);
  const [ip, setIp] = useState([0, 0, 0, 0]);
  const { data } = useQuery("ip", getIp);

  const ipNum = useMemo(() => {
    const arr = new Uint8Array(ip);
    const dataView = new DataView(arr.buffer);

    return dataView.getUint32(0, false);
  }, [ip]);

  const mask = useMemo(() => (cidr && ~((1 << (32 - cidr)) - 1)) >>> 0, [cidr]);

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
    <Container maxWidth="xl">
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
      </Grid>

      <Box>IP: {_.get(data, "ip")}</Box>
      <Box>32-bit integer: {ipNum}</Box>
      <Box>Hex: {ip.map((s) => s.toString(16).padStart(2, "0"))}</Box>
      {enableCidr && (
        <Box>
          <div>
            Number of IPs in CIDR block: {Math.pow(2, 32 - cidr)} (
            {Math.pow(2, 32 - cidr).toExponential(2)})
          </div>
          <div>Lowest IP: {numToIp(lowBlockNum).join(".")}</div>
          <div>
            Highest IP (Broadcast IP): {numToIp(highBlockNum).join(".")}
          </div>
        </Box>
      )}
    </Container>
  );
};

export default Home;
