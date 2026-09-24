import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./Pages/Home";
import { Shop } from "./Pages/Shop";
import { ProductPage } from "./Pages/Product";
import { NotFound } from "./Pages/NotFound";
import { InfoPage } from "./Pages/Info";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/info/:page" element={<InfoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
