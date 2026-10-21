import { useState } from "react";
import AccountSwitcherModal from "./AccountSwitcherModal";
import SecretLeftTap from "./SecretLeftTap";

export default function MultiAccountHost() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SecretLeftTap onUnlock={() => setOpen(true)} />
      <AccountSwitcherModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
