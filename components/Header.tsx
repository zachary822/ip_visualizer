import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { useRouter } from "next/router";

const TabLink = ({ href, ...props }: { href: string }) => {
  return (
    <Link href={href}>
      <MuiLink {...props} />
    </Link>
  );
};

const Header = () => {
  const { pathname } = useRouter();
  return (
    <Box sx={{ m: 1 }}>
      <Tabs value={pathname}>
        <Tab component={TabLink} label="IP Things here" href="/" value="/" />
        <Tab
          component={TabLink}
          label="DNS Things here"
          href="/dns"
          value="/dns"
        />
      </Tabs>
    </Box>
  );
};

export default Header;
