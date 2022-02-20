import { useEffect } from "react";
import { getDNSQuery } from "../queries";

function DNS() {
  useEffect(() => {
    getDNSQuery("server1.thoughtbank.app").then(console.log);
  }, []);

  return <div>yay</div>;
}

export default DNS;
