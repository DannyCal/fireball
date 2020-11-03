import React from 'react';
import { valueToSVG } from '../assets/svg/cardSvgs';
// import { card } from '../assets/svg/cardSvg';


const Card = ({ className, color, value, onClick, offered = null, restricted = null }) => {

    // const scale = (window && window.innerHeight && (window.innerHeight / 1200)) || 0.5

    return <div className={className} onClick={onClick} style={{ width: 'min-content', height: 'min-content' }}>
        {offered && 'Offer'}
        {restricted && "Declined!"}
        {valueToSVG[value](0.2)}
        {/* <span>{card(scale, color)}</span> */}
    </div>
}

export default Card;