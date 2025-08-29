import React from 'react';
import "./DeliveryListWindow.css";

import type { RawShipment } from '../../types/shipments';

// define prop interface...
interface DeliveryListWindowProps {
    shipment: RawShipment;
    handleClick: (shipment: RawShipment) => void;
}

const DeliveryListWindow: React.FC<DeliveryListWindowProps> = ({
    shipment,
    handleClick,
}) => {
    return (
        <figure className="dlw_figure" onClick={() => handleClick(shipment)}>
            <div className="dlw_header" >
                <div className="dlw_header_col">
                    <h5>Pro No:</h5>
                    <h5 className="weak">{shipment.proNumber}</h5>
                </div>
                <div className="dlw_header_col">
                    <h5>Terminal:</h5>
                    <h5 className="weak">{shipment.terminal.toString()}</h5>
                </div>
            </div>
            <section className="dlw_body">
                <div className="dlw_single_row">
                    <h5>{shipment.shipper}</h5>
                    <h5 className="weak">{shipment.productDesc}</h5>
                </div>
                <div className="dlw_double_row">
                    <div className="dlw_double_col right_col">
                        <h4>Weight:</h4>
                        <h4 className="weak">{shipment.weight} lbs</h4>
                    </div>
                    <div className="dlw_double_col left_col">
                        <h4>Dimensions:</h4>
                        <h4 className="weak">{shipment.width}"w x {shipment.height}"h</h4>
                    </div>
                </div>
            </section>
        </figure>
    )
};

export default DeliveryListWindow;