import { Box, Button, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import { RoomContext } from "../Contexts/Room.jsx";
import { getSocket } from '../Contexts/Socket.jsx';
import { useDraw } from '../hooks/useDraw.jsx';
import drawSomething from '../util/drawSomething.js';
import { useNavigate } from 'react-router-dom';

const Canvas = () => {
  const socket = getSocket()
  const navigate = useNavigate();

  const { canvasRef, onMouseDown, clear } = useDraw(createSomething);
  const [color, setColor] = useColor("#000000");
  const [userCount, setUserCount] = useState(1);
  const [tool, setTool] = useState("pencil");
  const [shapeStart, setShapeStart] = useState(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState(null);
  const [history, setHistory] = useState([]);
  const previewCanvasRef = useRef(null);

  const context = useContext(RoomContext);
  const { roomName } = context;

  // Save canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = canvas.toDataURL();
    setHistory(prev => [...prev, state]);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    
    // Save initial blank state
    if (canvasRef.current && history.length === 0) {
      const initialState = canvasRef.current.toDataURL();
      setHistory([initialState]);
    }
    
    socket.emit("clientready", roomName)

    socket.on("getcanvasstate", () => {
      if (!canvasRef.current?.toDataURL())
        return;

      socket.emit("canvasstate", { roomName, state: canvasRef.current.toDataURL() });
    });

    socket.on("canvasstatefromserver", (state) => {
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        saveToHistory();
      };
    });

    socket.on("drawsomething", ({ prevCoordinate, currCoordinate, color }) => {
      if (!ctx) return;
      drawSomething({ ctx, color, prevCoordinate, currCoordinate })
    })

    socket.on("drawshape", ({ shape, start, end, color }) => {
      if (!ctx) return;
      drawShape({ ctx, shape, start, end, color });
    });

    socket.on("drawcomplete", () => {
      saveToHistory();
    });

    socket.on("clear", () => {
      clear();
      setHistory([]);
    });

    socket.on("undo", (state) => {
      if (!ctx) return;
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
    });

    socket.on("roomusercount", ({ roomName: room, count }) => {
      if (room !== roomName) return;
      setUserCount(count);
    });

    return () => {
      socket.emit("leaveroom", roomName);
      socket.off("drawsomething")
      socket.off("getcanvasstate")
      socket.off("canvasstatefromserver")
      socket.off("drawshape")
      socket.off("drawcomplete")
      socket.off("roomusercount")
      socket.off("clear")
      socket.off("undo")
    }

  }, [canvasRef, roomName]);

  function createSomething({ ctx, prevCoordinate, currCoordinate }) {
    if (tool !== "pencil") return;
    socket.emit("drawsomething", ({ roomName, color, prevCoordinate, currCoordinate }));
    drawSomething({ ctx, color, prevCoordinate, currCoordinate });
  }

  const drawShape = useMemo(() => {
    return ({ ctx, shape, start, end, color }) => {
      if (!start || !end) return;
      const strokeColor = typeof color === "string" ? color : color?.hex;
      if (!strokeColor) return;

      const lineWidth = 4;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      if (shape === "line") {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        return;
      }

      if (shape === "rect") {
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
        return;
      }

      if (shape === "circle") {
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = Math.hypot(end.x - start.x, end.y - start.y) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
  }, []);

  const computeCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handleCanvasMouseDown = (e) => {
    if (tool === "pencil") {
      onMouseDown();
      return;
    }
    const coords = computeCanvasCoords(e);
    if (coords) {
      setShapeStart(coords);
      setIsDrawingShape(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (tool === "pencil" || !isDrawingShape) return;
    const coords = computeCanvasCoords(e);
    if (coords) {
      setCurrentMousePos(coords);
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (tool === "pencil") {
      // Save history after pencil drawing is complete
      saveToHistory();
      socket.emit("drawcomplete", roomName);
      return;
    }
    const end = computeCanvasCoords(e);
    if (!shapeStart || !end) {
      setShapeStart(null);
      setIsDrawingShape(false);
      setCurrentMousePos(null);
      return;
    }
    
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawShape({ ctx, shape: tool, start: shapeStart, end, color: color.hex });
    socket.emit("drawshape", { roomName, shape: tool, start: shapeStart, end, color: color.hex });
    
    // Save to history after drawing the shape
    saveToHistory();
    socket.emit("drawcomplete", roomName);
    
    setShapeStart(null);
    setIsDrawingShape(false);
    setCurrentMousePos(null);
  };

  // Draw preview on preview canvas
  useEffect(() => {
    if (!isDrawingShape || !shapeStart || !currentMousePos) {
      const previewCtx = previewCanvasRef.current?.getContext('2d');
      if (previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
      return;
    }

    const previewCtx = previewCanvasRef.current?.getContext('2d');
    if (!previewCtx) return;

    previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    drawShape({ ctx: previewCtx, shape: tool, start: shapeStart, end: currentMousePos, color: color.hex });
  }, [isDrawingShape, shapeStart, currentMousePos, tool, color.hex, drawShape]);

  const handleUndo = () => {
    if (history.length <= 1) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };

    setHistory(newHistory);
    socket.emit("undo", { roomName, state: previousState });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");

    if (!exportCtx) return;

    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${roomName || "canvas"}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%)", padding: { xs: 2, md: 4 } }}>
      <Stack spacing={3} alignItems="center">
        <Paper elevation={3} sx={{ width: "100%", maxWidth: 1200, padding: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Room</Typography>
              <Typography variant="h5" fontWeight={700}>{roomName || "Untitled Room"}</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Chip color="primary" label={`${userCount} online`} />
              <Button 
                variant="outlined" 
                onClick={handleUndo} 
                disabled={history.length <= 1}
                disableElevation
              >
                Undo
              </Button>
              <Button variant="outlined" onClick={() => { clear(); setHistory([]); socket.emit("clear", roomName) }} disableElevation>
                Clear
              </Button>
              <Button variant="contained" onClick={handleDownload} disableElevation>
                Download
              </Button>
              <Button variant="text" color="secondary" onClick={() => { socket.emit("leaveroom", roomName); navigate("/"); }}>
                Exit
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-start" }} width="100%" maxWidth={1200}>
          <Paper elevation={3} sx={{ padding: 2.5, borderRadius: 3, width: { xs: "100%", md: 260 } }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tools</Typography>
            <ToggleButtonGroup
              color="primary"
              size="small"
              exclusive
              value={tool}
              onChange={(_, next) => next && setTool(next)}
              fullWidth
              sx={{ marginBottom: 2 }}
            >
              <ToggleButton value="pencil">Pencil</ToggleButton>
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="rect">Rect</ToggleButton>
              <ToggleButton value="circle">Circle</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Color</Typography>
            <ColorPicker width={220} height={180} color={color} onChange={setColor} hideHSV hideRGB />
          </Paper>

          <Paper elevation={3} sx={{ flex: 1, padding: { xs: 1, md: 2 }, borderRadius: 3, display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <canvas
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => {
                  if (isDrawingShape) {
                    handleCanvasMouseUp({ clientX: 0, clientY: 0 });
                  }
                }}
                ref={canvasRef}
                width={900}
                height={600}
                style={{
                  border: "2px solid #dfe4ec",
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                  cursor: tool === "pencil" ? "crosshair" : "default"
                }}
              />
              <canvas
                ref={previewCanvasRef}
                width={900}
                height={600}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  border: "2px solid transparent",
                  borderRadius: 12
                }}
              />
            </div>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  )
}

export default Canvas