import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import Head from "next/head";
import NextLink from "next/link";
import { useCallback, useState } from "react";
import { getDNSQuery } from "../queries";

function DNS() {
  const [hostname, setHostname] = useState<string>("vaulthealth.com");
  const [reverse, setReverse] = useState<boolean>(false);
  const [result, setResult] = useState<Array<any>>([]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      getDNSQuery({ hostname, type: reverse ? 12 : 1 }).then(setResult);
    },
    [hostname, reverse]
  );

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
          <form action="" onSubmit={onSubmit}>
            <Box>
              <FormControl>
                <Input
                  placeholder="hostname"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                />
              </FormControl>
              <Button type="submit">Query</Button>
              <Button color="error">Reset</Button>
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
          </form>
        </Box>
      </Container>
    </>
  );
}

export default DNS;
