import LegalDocPage from "@/components/LegalDocPage";

// Text lives in marketing/docs.json (lawyer-verified) and is rendered via the
// generated module. See LegalDocPage for why. Do not inline legal text here.
export default function VOP() {
  return <LegalDocPage docKey="vop" />;
}
