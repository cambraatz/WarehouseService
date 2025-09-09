import type { DeliveryManifestState } from "../DeliveryManifest";
import "./ListWindow.css";

interface ListWindowProps {
    renderSubheader: boolean;
    mfstDate: string | undefined;
    powerUnit: string | undefined;
    status: "Delivered" | "Undelivered";
    deliveries: DeliveryManifestState | undefined;
    selectDelivery: (deliveries: DeliveryManifestState, proNumber: string) => void;
}

const ListWindow: React.FC<ListWindowProps> = ({ renderSubheader, mfstDate, powerUnit, status, deliveries, selectDelivery }) => {
    return (
        <>
        {renderSubheader && (
            <div className="lw_subheader">
                <div className="lw_subheader_item">
                    <h4>Manifest Date:</h4>
                    <h4 className="weak">{mfstDate}</h4>
                </div>
                <div className="lw_subheader_item">
                    <h4>Power Unit:</h4>
                    <h4 className="weak">{powerUnit}</h4>
                </div>
            </div>
        )}
        <ListWindowContent 
            status={status}
            deliveries={deliveries!}
            selectDelivery={selectDelivery}
        />
        </>
    )
};

interface ListWindowContentProps {
    status: "Delivered" | "Undelivered";
    deliveries: DeliveryManifestState;
    selectDelivery: (deliveries: DeliveryManifestState, proNumber: string) => void;
}
const ListWindowContent: React.FC<ListWindowContentProps> = ({ status, deliveries, selectDelivery }) => {
    const renderDeliveries = (status: string, deliveries: DeliveryManifestState) => {
        if (status.includes("Undelivered") && Object.keys(deliveries).length === 0) {
            return(<tr><td align="center" colSpan={7}>No remaining deliveries...</td></tr>);
        } else if (Object.keys(deliveries).length === 0) {
            return(<tr><td align="center" colSpan={7}>No deliveries completed...</td></tr>);
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return Object.entries(deliveries).flatMap(([_, deliveryList]) => {
                return deliveryList.map((delivery) => (
                    <tr key={`${delivery.mfstKey}`} className={`lw_table_body ${status.toLowerCase()}`} id={delivery.mfstKey} onClick={handleClick}>
                        <td className="col1">{delivery.stop}</td>
                        <td className="col2">{delivery.proNumber}</td>
                        <td className="col3">{delivery.consName}</td>
                        <td className="col4">{delivery.consAdd1}</td>
                        <td className="col5 desktop_table">{delivery.consAdd2 ? delivery.consAdd2 : "---"}</td>
                        <td className="col6 desktop_table">{delivery.consCity}</td>
                        <td className="col7 desktop_table">{delivery.shipName}</td>
                    </tr>
                ))
            });
        } catch {
            alert("Warning: delivered table rendering error. Try Again.");
            return(<tr><td align="center" colSpan={7}>Error loading data, contact admin.</td></tr>);
        }
    }

    const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        const row = e.currentTarget;
        console.log('Row clicked:', row);
        const proNum: string = row.querySelector('.col2')!.textContent;
        selectDelivery(deliveries, proNum);
    };

    return (
        <>
        <figure className="lw_table_figure">
            <table className={`lw_table ${(status === "Delivered") ? "trailing_table" : ""}`}>
                <thead>
                    <tr className="lw_title_row">
                        <th className="lw_title" colSpan={7}>{status}</th>
                    </tr>
                    <tr className={`lw_column_header ${(status === "Delivered") ? "lw_delivered_items" : ""}`}>
                        <th className="col1">Stop</th>
                        <th className="col2">Pro No</th>
                        <th className="col3">Consignee</th>
                        <th className="col4">Address<span className="desktop_span"> 1</span></th>
                        <th className="col5 desktop_table">Address 2</th>
                        <th className="col6 desktop_table">City</th>
                        <th className="col7 desktop_table">Shipper</th>
                    </tr>
                </thead>
                <tbody>
                    { renderDeliveries(status, deliveries) }
                </tbody>
            </table>
        </figure>
        </>
    );
};

export default ListWindow;