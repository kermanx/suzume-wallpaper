/// <reference types="vite/client" />

declare module "virtual:szm" {
  const loader: () => Promise<string[]>
  export default loader
}
