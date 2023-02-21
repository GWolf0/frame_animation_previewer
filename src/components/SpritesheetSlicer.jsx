import { useEffect, useRef, useState } from "react";
import AppService from "../services/AppService";

/*external*/
let sliceEditing={isSlicing:false,cellSize:8,selectedSliceIdx:-1};

/*component*/
function SpritesheetSlicer({onClose,onImportImages}){
//vars
let cc;//canvas context
//consts

//refs
const canRef=useRef();
const fileInputRef=useRef();
const hiddenCanRef=useRef();
const sliceFrameRef=useRef();
const autoSliceFrameXRef=useRef();
const autoSliceFrameYRef=useRef();
//states
const [canSize,setCanSize]=useState({w:0,h:0});
const [hiddenCanSize,setHiddenCanSize]=useState({w:100,h:100});
const [image,setImage]=useState(null);
const [slices,setSlices]=useState([]);
const [cellSize,setCellSize]=useState(8);
const [selectedSliceIdx,setselectedSliceIdx]=useState(-1);
const [layout,setLayout]=useState({autoSliceMenuOn:false});
//effects
useEffect(()=>{
    const can=document.getElementById("sssCan");
    //events handlers
    function onWindowResize(e){
        const canParent=can.parentNode;
        setCanSize({w:canParent.clientWidth,h:canParent.clientHeight});
    }
    function onKeyPress(e){
        const kc=e.keyCode;
        //console.log(kc);
        if(kc==46){//delete key
            removeSelectedSlice();
        }
    }
    //slices editing
    function onCanvasClick(e){
        const canBR=can.getBoundingClientRect();
        if(!sliceEditing.isSlicing){
            const mp={x:Math.floor((e.clientX-canBR.x)/sliceEditing.cellSize)*sliceEditing.cellSize,y:Math.floor((e.clientY-canBR.y)/sliceEditing.cellSize)*sliceEditing.cellSize};
            sliceFrameRef.current.style.left=`${mp.x}px`;
            sliceFrameRef.current.style.top=`${mp.y}px`;
            sliceFrameRef.current.style.width=`${0}px`;
            sliceFrameRef.current.style.height=`${0}px`;
        }else{
            const mp={x:Math.ceil((e.clientX-canBR.x)/sliceEditing.cellSize)*sliceEditing.cellSize,y:Math.ceil((e.clientY-canBR.y)/sliceEditing.cellSize)*sliceEditing.cellSize};
            //const sliceFrameBR=sliceFrameRef.current.getBoundingClientRect();
            const from={x:parseInt(sliceFrameRef.current.style.left),
                y:parseInt(sliceFrameRef.current.style.top)
            };
            const to={x:mp.x-parseInt(sliceFrameRef.current.style.left),
                y:mp.y-parseInt(sliceFrameRef.current.style.top)
            };
            if(to.x>=0&&to.y>=0){
                const newSlice={id:AppService.getID(),
                    from:from,
                    to:to,
                    img:null,
                };
                sliceFrameRef.current.style.left=`${0}px`;
                sliceFrameRef.current.style.top=`${0}px`;
                sliceFrameRef.current.style.width=`${0}px`;
                sliceFrameRef.current.style.height=`${0}px`;
                setSlices(prev=>[...prev,newSlice]);
            }
        }
        sliceEditing.isSlicing=!sliceEditing.isSlicing;
    }
    function onCanvasMove(e){
        const canBR=canRef.current.getBoundingClientRect();
        const mp={x:Math.ceil((e.clientX-canBR.x)/sliceEditing.cellSize)*sliceEditing.cellSize,y:Math.ceil((e.clientY-canBR.y)/sliceEditing.cellSize)*sliceEditing.cellSize};//console.log(mp)
        if(sliceEditing.isSlicing){
            const size={w:mp.x-parseFloat(sliceFrameRef.current.style.left),h:mp.y-parseFloat(sliceFrameRef.current.style.top)};
            sliceFrameRef.current.style.width=`${size.w}px`;
            sliceFrameRef.current.style.height=`${size.h}px`;
        }
    }
    //events
    window.addEventListener('resize',onWindowResize);
    window.addEventListener('keyup',onKeyPress);
    can.addEventListener('click',onCanvasClick);
    can.parentNode.addEventListener('mousemove',onCanvasMove);
    //init
    onWindowResize();
    //clear events
    return ()=>{
        window.removeEventListener('resize',onWindowResize);
        window.removeEventListener('keyup',onKeyPress);
        can.removeEventListener('click',onCanvasClick);
        can.parentNode.removeEventListener('mousemove',onCanvasMove);
    }
},[]);
useEffect(()=>{
    sliceEditing.cellSize=cellSize;
    setTimeout(()=>{
        draw();
    },100)
},[image,canSize,cellSize]);
useEffect(()=>{
    //console.log(slices)
    if(slices.length>0){
        setselectedSliceIdx(slices.length-1);
    }
},[slices]);
useEffect(()=>{
    sliceEditing.selectedSliceIdx=selectedSliceIdx;
    if(selectedSliceIdx>-1){
        updateHiddenCanvas();
    }else{
        clearHiddenCanvas();
    }
},[selectedSliceIdx]);
//methods
function onImportImage(){
    fileInputRef.current.click();
}
function onFileInputChange(){
    const files=fileInputRef.current.files;
    if(files.length<1)return;
    const imgFile=files[0];
    const imgUrl=AppService.fileToUrl(imgFile);
    const img=new Image();
    img.onload=()=>{
        //draw();console.log("draw")
    }
    img.src=imgUrl;
    setImage({id:AppService.getID(),...imgFile,url:imgUrl,img:img});
}
function clearImage(){
    if(slices.length>0){
        if(confirm("Remove all slices?")){
            removeAllSlices();
        }
    }else{
        if(confirm("Clear image?")){
            setImage(null);
            fileInputRef.current.value="";
        }
    }
}
function importSlicesAsImages(){
    const images=slices.map((slice,i)=>slice.img);
    //console.log(images);
    onImportImages(images);
    thisOnClose();
}
function onClickOnSliceItem(idx){
    setselectedSliceIdx(idx);
}
function removeSelectedSlice(){
    if(sliceEditing.selectedSliceIdx<0)return;
    setSlices(prev=>prev.filter((slice,i)=>i!==sliceEditing.selectedSliceIdx));
    setselectedSliceIdx(-1);
}
function removeAllSlices(){
    setSlices([]);
    setselectedSliceIdx(-1);
}
function onAutoSlice(){
    const frameX=Math.max(parseInt(autoSliceFrameYRef.current.value),2);
    const frameY=Math.max(parseInt(autoSliceFrameYRef.current.value),2);
    //console.log(frameX,frameY);
    if(isNaN(frameX)||isNaN(frameY)||frameX==null||frameY==null)return;
    //const imgSize={w:image.img.width*cellSize,h:image.img.height*cellSize};
    const cols=Math.floor(image.img.width/frameX);
    const rows=Math.floor(image.img.height/frameY);
    //console.log("cols",cols,"rows:",rows);
    let newSlices=[];
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            const newSlice={id:AppService.getID(),
                from:{
                    x:x*frameX*cellSize,
                    y:y*frameY*cellSize,
                },
                to:{
                    x:frameX*cellSize,
                    y:frameY*cellSize,
                },
                img:null,
            };
            previewSlice(newSlice);
            newSlices.push(newSlice);
        }
    }
    //console.log(newSlices);
    setSlices(prev=>[...prev,...newSlices]);
    setLayout(prev=>({...prev,autoSliceMenuOn:false}));
}
//drawing
function draw(){
    cc=canRef.current.getContext('2d');
    cc.imageSmoothingEnabled=false;
    const cw=canRef.current.width;const ch=canRef.current.height;
    //clear
    cc.fillStyle="#212121";
    cc.fillRect(0,0,cw,ch);
    //draw current image
    if(image!=null){
        //grid
        cc.strokeStyle="#444";
        cc.lineWidth=1;
        const cols=Math.floor(cw/cellSize);const rows=Math.floor(ch/cellSize);
        for(let y=0;y<rows+1;y++){
            for(let x=0;x<cols+1;x++){
                //cols
                cc.beginPath();
                cc.moveTo(0,y*cellSize);
                cc.lineTo(cw,y*cellSize);
                cc.stroke();
                cc.closePath();
                //rows
                cc.beginPath();
                cc.moveTo(x*cellSize,0);
                cc.lineTo(x*cellSize,ch);
                cc.stroke();
                cc.closePath();
            } 
        }
        //image
        //const size={w:ch*image.img.width/image.img.height,h:ch};
        const size={w:image.img.width*cellSize,h:image.img.height*cellSize};
        const offs=cellSize*0;
        cc.drawImage(image.img,0+offs,0+offs,size.w,size.h);
        cc.strokeStyle="#ccc";
        cc.strokeRect(0,0,size.w,size.h);
        // const size={w:image.img.width*pixelsPerUnit*cellSize,h:image.img.height*pixelsPerUnit*cellSize};
        // const offs=cellSize*1;
        // cc.drawImage(image.img,0+offs,0+offs,size.w,size.h);
    }
}
//hidden canvas
function updateHiddenCanvas(){
    let slice=slices[selectedSliceIdx];
    if(slice){
        setHiddenCanSize({w:slice.to.x,h:slice.to.y});
        setTimeout(()=>{
            previewSlice(slice);
        },100);
    }
}
function clearHiddenCanvas(){
    const hcc=hiddenCanRef.current.getContext("2d");
    const cw=hiddenCanRef.current.width;const ch=hiddenCanRef.current.height;
    //clear
    hcc.clearRect(0,0,cw,ch);
}
function previewSlice(slice){
    const hcc=hiddenCanRef.current.getContext("2d");
    hcc.imageSmoothingEnabled=false;
    const cw=hiddenCanRef.current.width;const ch=hiddenCanRef.current.height;
    //clear
    // hcc.fillStyle="#212121";
    // hcc.fillRect(0,0,cw,ch);
    hcc.clearRect(0,0,cw,ch);
    //draw current slice
    hcc.drawImage(image.img,Math.floor(slice.from.x/cellSize),Math.floor(slice.from.y/cellSize),Math.floor(slice.to.x/cellSize),Math.floor(slice.to.y/cellSize),0,0,cw,ch);
    //create image object if doesn't exists
    if(!slice.img){
        const newImg=new Image();
        newImg.onload=()=>{slice.img=newImg};
        newImg.src=hiddenCanRef.current.toDataURL();
    }
}
//others
function thisOnClose(){
    onClose();
}


return (
<div className="spritesheetSlicerContainer bg-lighter fixed left-1/2 top-16 -translate-x-1/2 rounded overflow-hidden border border-semitrans grid" style={{width:'720px',maxWidth:'99vw',height:'720px',maxHeight:'99vh',gridAutoRows:'48px minmax(0,auto) 48px'}}>
    <section className="spritesheetSlicerHeader border-b border-semitrans flex items-center px-2 md:px-4">
        <p className="text-darker font-semibold text-sm">Spritesheet Slicer</p>
        <button onClick={thisOnClose} className="p-1 text-dark ml-auto">&times;</button>
    </section>
    <section className="spritesheetSlicerBody relative overflow-hidden">
        <input ref={fileInputRef} onChange={onFileInputChange} type="file" accept="image/*" hidden />
        <canvas className="relative" id="sssCan" ref={canRef} width={canSize.w} height={canSize.h}></canvas>
        <div className="absolute bg-primary opacity-20 pointer-events-none" id="sliceFrame" ref={sliceFrameRef}></div>
        {
            slices.map((slice,i)=>(
               <div onClick={()=>onClickOnSliceItem(i)} key={slice.id} className={`sliceItem absolute opacity-20 border ${selectedSliceIdx===i?'bg-accent':'bg-lighter'}`} style={{left:`${slice.from.x}px`,top:`${slice.from.y}px`,width:`${slice.to.x}px`,height:`${slice.to.y}px`}}></div> 
            ))
        }
        {
            image===null&&
            <div onClick={onImportImage} className="absolute top-0 left-0 w-full h-full bg-lighter flex flex-col items-center justify-center cursor-pointer hover:bg-lightest">
                <i className="bi-image text-dark text-5xl mb-1"></i>
                <p className="text-dark tracking-wide text-sm">Import Spritesheet Image</p>
            </div>
        }
    </section>
    <section className="spritesheetSlicerFooter relative bg-light border-t border-semitrans flex items-center px-2 md:px-4">
        {image!=null&&<button onClick={()=>{setLayout(prev=>({...prev,autoSliceMenuOn:!prev.autoSliceMenuOn}))}} className="rounded bg-primary px-2 mr-2 py-1 text-lighter text-xs md:text-sm">Auto</button>}
        <ul hidden={!layout.autoSliceMenuOn} className="autoSliceMenu absolute bg-lighter border border-dark rounded overflow-hidden p-1" style={{left:'2px',bottom:'50px',width:'222px'}}>
            <li className="py-1">
                <input ref={autoSliceFrameXRef} className="w-full bg-darker text-light py-1 text-center" type="number" placeholder="frame x size" />
            </li>
            <li className="py-1">
                <input ref={autoSliceFrameYRef} className="w-full bg-darker text-light py-1 text-center" type="number" placeholder="frame y size" />
            </li>
            <li className="py-1">
                <button onClick={onAutoSlice} className="w-full rounded bg-primary text-light py-1">slice</button>
            </li>
        </ul>
        <input className="bg-dark text-light rounded text-xs py-1 text-center mr-2 w-16" value={cellSize} onChange={(e)=>{setCellSize(Math.max(e.target.value,2))}} placeholder="cellsize" type="number" min={2} max={100} />
        {image!=null&&<button onClick={clearImage} className="rounded bg-variant text-lighter px-4 py-1 text-sm hover:opacity-70"><i className="bi-x"></i> Clear</button>}
        {image!=null&&<button title="Import slices as images" onClick={importSlicesAsImages} className="ml-auto rounded bg-primary text-lighter px-4 py-1 text-xs md:text-sm hover:opacity-70"><i className="bi-import"></i> Import Images</button>}
    </section>
    <canvas className="absolute bottom-14 right-2 border" id="hiddenCan" hidden={image==null} ref={hiddenCanRef} width={hiddenCanSize.w} height={hiddenCanSize.h}></canvas>
</div>
)
}

export default SpritesheetSlicer;