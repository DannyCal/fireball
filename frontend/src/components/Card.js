import React from 'react';
import { valueToSVG } from '../assets/svg/cardSvgs';


const Card = ({ value }) => {

    return <div >
        {valueToSVG[value](0.2)}
    </div>
}

export default Card;