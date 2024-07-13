import { useEffect, useRef, useState } from "react"

export const useDraw=(createSomething)=>{

    const canvasRef=useRef(null);
    const prevCoordinate=useRef({});

    const [isMouseDown,setIsMouseDown]=useState(false);


    const onMouseDown=()=>{
        setIsMouseDown(true)
    }

    const clear=()=>{
        const canvas=canvasRef.current;

        if(!canvas)
                return;

        const ctx=canvas.getContext('2d');
        if(!ctx)
            return;

        ctx.clearRect(0,0,canvas.width,canvas.height)
        
    }


    useEffect(()=>{

        const handler=(e)=>{
            const currCoordinate=computeCoordinatesForCanvas(e);
            
            if(!isMouseDown)
                return;

            const ctx=canvasRef.current?.getContext('2d');

            if(!ctx || !currCoordinate)
                return;

            createSomething({ctx,currCoordinate,prevCoordinate:prevCoordinate.current})
            prevCoordinate.current=currCoordinate;

        }

        // to get the coordinates with respect to canvas as the parent element
        const computeCoordinatesForCanvas=(e)=>{
            const canvas=canvasRef.current;
            if(!canvas)
                return;
            
            const rect=canvas.getBoundingClientRect();
            const x=e.clientX-rect.left;
            const y=e.clientY-rect.top;

            return {x,y}
        }


        const mouseUpHandler=()=>{
            setIsMouseDown(false)
            prevCoordinate.current=null
        }

        canvasRef.current?.addEventListener('mousemove',handler)
        window.addEventListener('mouseup',mouseUpHandler)
        
        return ()=>{
            canvasRef.current?.removeEventListener('mousemove',handler)
            window.removeEventListener('mouseup',mouseUpHandler)
        }

    },[createSomething])

    return {canvasRef,onMouseDown,clear}
}

