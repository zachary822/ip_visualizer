import { useEffect } from "react";
import { getDNSQuery } from "../queries";

function DNS() {
  useEffect(() => {
    getDNSQuery({ hostname: "8.8.8.8", type: 12 }).then(console.log);
  }, []);

  return <div>yay</div>;
}

export default DNS;
