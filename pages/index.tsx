import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import _, { parseInt } from "lodash";
import type { NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import styles from "../styles/Home.module.css";

function Item(props) {
  const { sx, light, ...other } = props;
  return (
    <Box
      sx={{
        p: 1,
        m: 0,
        bgcolor: light ? "grey.400" : "grey.100",
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

const Home: NextPage = () => {
  const [ip, setIp] = useState([1, 0, 0, 1]);
  const ipNum = useMemo(
    () => _(ip).reduce((acc, i) => (acc << 8) + i, 0) >>> 0,
    [ip]
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
        <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
          <IpSegment value={ip[0]} onChange={ipSegmentHandler(0)} />.
          <IpSegment value={ip[1]} onChange={ipSegmentHandler(1)} />.
          <IpSegment value={ip[2]} onChange={ipSegmentHandler(2)} />.
          <IpSegment value={ip[3]} onChange={ipSegmentHandler(3)} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
          {_.map(ipNum.toString(2).padStart(32, "0"), (d, i) => (
            <Item key={i} light={Math.floor(i / 8) % 2 === 0}>
              {d}
            </Item>
          ))}
        </Box>
      </main>
    </div>
  );
};

export default Home;
