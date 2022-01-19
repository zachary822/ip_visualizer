import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import _, { parseInt } from "lodash";
import type { NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import styles from "../styles/Home.module.css";

function Item(props) {
  const { sx, light, mask, ...other } = props;
  return (
    <Box
      sx={{
        p: 1,
        m: 0,
        bgcolor: mask ? "#4dd0e1" : light ? "grey.400" : "grey.100",
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
      inputProps={{ min: 0, max: 255 }}
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
      inputProps={{ min: 0, max: 32 }}
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
  const [enableCidr, setEnableCidr] = useState(true);
  const [cidr, setCidr] = useState(0);
  const [ip, setIp] = useState([1, 0, 0, 1]);
  const ipNum = useMemo(
    () => _(ip).reduce((acc, i) => (acc << 8) + i, 0) >>> 0,
    [ip]
  );
  const mask = useMemo(
    () => ((Math.pow(2, cidr) - 1) << (32 - cidr)) >>> 0,
    [cidr]
  );
  const lowBlockNum = useMemo(() => {
    return (ipNum & mask) >>> 0;
  }, [ipNum, mask]);
  const highBlockNum = useMemo(
    () => (lowBlockNum | (Math.pow(2, 32 - cidr) - 1)) >>> 0,
    [lowBlockNum, cidr]
  );

  const ipSegmentHandler = (i) => (e) => {
    setIp((ip) => {
      const n = [...ip];
      n[i] = parseInt(e.target.value);
      return n;
    });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>IP Address</title>
        <meta name="description" content="Interactive IP Address Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
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
        <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
          <IpSegment value={ip[0]} onChange={ipSegmentHandler(0)} />.
          <IpSegment value={ip[1]} onChange={ipSegmentHandler(1)} />.
          <IpSegment value={ip[2]} onChange={ipSegmentHandler(2)} />.
          <IpSegment value={ip[3]} onChange={ipSegmentHandler(3)} />
          {enableCidr && (
            <>
              /
              <Cidr
                value={cidr}
                onChange={(e) => setCidr(parseInt(e.target.value))}
              />
            </>
          )}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
          {_.map(ipNum.toString(2).padStart(32, "0"), (d, i) => (
            <Item
              key={i}
              light={Math.floor(i / 8) % 2 === 0}
              mask={enableCidr && i < cidr}
            >
              {d}
            </Item>
          ))}
        </Box>
        <Box>32-bit integer: {ipNum}</Box>
        {enableCidr && (
          <Box>
            <div>Number of IPs in CIDR block: {Math.pow(2, 32 - cidr)}</div>
            <div>Lowest IP: {numToIp(lowBlockNum).join(".")}</div>
            <div>Highest IP: {numToIp(highBlockNum).join(".")}</div>
          </Box>
        )}
      </main>
    </div>
  );
};

export default Home;
