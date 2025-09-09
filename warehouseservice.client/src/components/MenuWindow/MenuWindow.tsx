import React from 'react';
import "./MenuWindow.css";

// define prop interface...
interface MenuWindowProps {
    prompt: string;
    pressButton: (target: string) => void;
}

const MenuWindow: React.FC<MenuWindowProps> = ({
    prompt,
    pressButton,
}) => {
    return (
        <>
        <div className="mw_header">
            <h4 className="mw_header_prompt">{prompt}</h4>
        </div>
        <div className="warehouse_div">
            <button className="warehouse_div_button" type="button" onClick={() => pressButton("cross_dock")}>Cross Dock Processing</button>
            <button className="warehouse_div_button" type="button" onClick={() => pressButton("unload")}>Unload Vehicle</button>
            <button className="warehouse_div_button" type="button" onClick={() => pressButton("load")}>Load Vehicle</button>
        </div>
        </>
    )
};

export default MenuWindow;