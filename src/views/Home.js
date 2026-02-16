import { useState } from "react";
import Banner from "../component/banner";
import FAQ from "../component/faq";
import PickLocation from "../component/pickLocation";

export default function Home() {
    const [showPickupModal, setShowPickupModal] = useState(false);

    const handlePickupClick = () => {
        setShowPickupModal(true);
    };

    const handleCloseModal = () => {
        setShowPickupModal(false);
    };

    return (
        <>
            {/* Delivery/Pickup Toggle Bar - Only on Homepage */}
            <div className="home-delivery-section">
                <div className="delivery-toggle">
                    <button className="toggle-btn delivery-btn active">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 18.5C18 19.3284 17.3284 20 16.5 20C15.6716 20 15 19.3284 15 18.5C15 17.6716 15.6716 17 16.5 17C17.3284 17 18 17.6716 18 18.5Z"/>
                            <path d="M9 18.5C9 19.3284 8.32843 20 7.5 20C6.67157 20 6 19.3284 6 18.5C6 17.6716 6.67157 17 7.5 17C8.32843 17 9 17.6716 9 18.5Z"/>
                            <path d="M1 1H4L6 13H18L21 5H6"/>
                        </svg>
                        DELIVERY
                    </button>
                    <span className="toggle-divider">OR</span>
                    <button className="toggle-btn pickup-btn" onClick={handlePickupClick}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21Z"/>
                        </svg>
                        PICK UP
                    </button>
                </div>
            </div>

            <Banner />
            <FAQ />

            {/* Pickup Modal */}
            <PickLocation isOpen={showPickupModal} onClose={handleCloseModal} />
        </>
    );
}
