import type { MetaFunction } from "@remix-run/node";
import ColorMixer from "../components/ColorMixer";

export const meta: MetaFunction = () => {
  return [
    { title: "Color Mixing Generator" },
    { name: "description", content: "Generate color mixes from available colors" },
  ];
};

export default function Index() {
  return (
    <div className="font-sans min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Welcome to Color Mixing Generator</h1>
      <ColorMixer />
    </div>
  );
}
