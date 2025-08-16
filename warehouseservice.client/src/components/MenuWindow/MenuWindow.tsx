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
            <h4 className="prompt">{prompt}</h4>
        </div>
        <div className="warehouse_div">
            <button type="button" onClick={() => pressButton("unload")}>Unload Vehicle</button>
            <button type="button" onClick={() => pressButton("load")}>Load Vehicle</button>
        </div>
        </>
    )
};

export default MenuWindow;