const drawSomething=({ctx,color,prevCoordinate,currCoordinate})=>{
    const lineWidth=5;
    console.log(currCoordinate)
    const currX=currCoordinate?.x;
    const currY=currCoordinate?.y;

        let startCoordinate=prevCoordinate ?? currCoordinate 
        ctx.beginPath();
        ctx.lineWidth=lineWidth;
        ctx.strokeStyle=color.hex;
        ctx.moveTo(startCoordinate.x,startCoordinate.y);
        ctx.lineTo(currX,currY);
        ctx.stroke();

        ctx.fillStyle=color.hex
        ctx.beginPath();
        ctx.arc(startCoordinate.x,startCoordinate.y,2,0,2*Math.PI)
        ctx.fill()
}
export default drawSomething