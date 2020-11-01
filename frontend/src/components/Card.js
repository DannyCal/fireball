import React from 'react';
import { valueToSVG } from '../assets/svg/cardSvgs';


const Card = ({ value, onClick, offered = null, restricted = null }) => {

    return <div onClick={onClick} style={{ width: 'min-content', height: 'min-content' }}>
        {offered && 'Offer'}
        {restricted && "Offered Already!"}
        {valueToSVG[value](0.2)}
    </div>
}

export default Card;