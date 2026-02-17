import DealsCarousel from "../component/dealsCarousel";
import Footer from "../component/footer";
import Header from "../component/header";
import ProductGrid from "../component/productGrid";
import SecondNavbar from "../component/secondNavbar";

export default function Deals() {
    return (
        <>
            <Header />
            <SecondNavbar />
            <DealsCarousel />
            <ProductGrid />
            <Footer />

        </>
    );
}
