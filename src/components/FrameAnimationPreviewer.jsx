import { useEffect, useRef, useState } from "react";
import AppService from "../services/AppService";
import SpritesheetSlicer from "./SpritesheetSlicer";

/*external vars*/
let player={can:null,cc:null,elapsed:0,frames:[],currentFrameIdx:0,isPlaying:false,loop:true,zoom:0.5,antialias:true};
let lastDate,dt;
/*external functions*/
function setupPlayer(can){
    player.can=can;//console.log(player.can)
    player.cc=player.can.getContext('2d');
    lastDate=new Date();
    drawAnimation();
}
function updateAnimation(){
    if(!player.isPlaying)return;
    const frames=player.frames;
    //update deltatime
    const curDate=new Date();
    dt=(curDate-lastDate)/1000;//delta time in seconds
    lastDate=curDate;
    //update frame
    if(frames.length>0&&frames[player.currentFrameIdx]){
        player.elapsed+=dt;
        if(player.elapsed>frames[player.currentFrameIdx].duration){
            player.elapsed=0;
            player.currentFrameIdx++;
            if(!player.loop&&player.currentFrameIdx==frames.length){
                window.dispatchEvent(new CustomEvent('playerstoped'));
                player.currentFrameIdx%=frames.length;
                return;
            }
            player.currentFrameIdx%=frames.length;
        }
    }
}
function drawAnimation(){
    requestAnimationFrame(drawAnimation);
    const can=player.can;
    const cc=player.cc;
    if(can===undefined||can==null||cc===undefined||cc==null)return;
    const frames=player.frames;
    updateAnimation();
    const cw=can.width;const ch=can.height;
    cc.imageSmoothingEnabled=player.antialias;
    //clear
    // cc.fillStyle="#212121";
    // cc.fillRect(0,0,cw,ch);
    cc.clearRect(0,0,cw,ch);
    const curFrame=frames[player.currentFrameIdx];
    //draw current frame
    if(frames.length>0&&curFrame){
        const size={w:curFrame.img.width*player.zoom,h:curFrame.img.height*player.zoom};
        cc.save();
        cc.translate(cw*0.5-size.w*0.5,ch*0.5-size.h*0.5);
        cc.scale(player.zoom,player.zoom)
        cc.drawImage(curFrame.img,0,0,size.w,size.h);
        cc.strokeStyle="#ccc";
        cc.strokeRect(0,0,size.w,size.h);
        cc.restore();
    }
}

/*component*/
function FrameAnimationPreviewer(){
//consts
const MAX_ZOOM=10;
//refs
const fileInputRef=useRef();
const canRef=useRef();
//states
const [isMobile,setIsMobile]=useState(false);
const [images,setImages]=useState([]);
const [frames,setFrames]=useState([]);
const [preview,setPreview]=useState({isPlaying:false,loop:true,zoom:0.5,antialias:true,bg:false});
const [canSize,setCanSize]=useState({w:360,h:360});
const [layout,setLayout]=useState({spriteSheetSlicerOn:false,previewContainerConfMenuOn:false});

//effects
useEffect(()=>{
    //events handlers
    function onWindowResize(e){
        setIsMobile(window.innerWidth<720);
    }
    function onPlayerStoped(e){
        setPreview(prev=>({...prev,isPlaying:false}));
    }
    //events
    window.addEventListener('resize',onWindowResize);
    window.addEventListener('playerstoped',onPlayerStoped);
    //init/setup
    setupPlayer(document.getElementById("can"));
    onWindowResize();
    //clear events
    return ()=>{
        window.removeEventListener('resize',onWindowResize);
        window.removeEventListener('playerstoped',onPlayerStoped);
    }
},[]);
useEffect(()=>{
    const canParent=canRef.current.parentNode;//console.log(canParent.clientWidth,canParent.clientHeight)
    // setCanSize({w:canParent.parentNode.clientWidth,h:isMobile?262:382});
    setCanSize({w:canParent.parentNode.clientWidth,h:canParent.clientHeight});
},[isMobile]);
useEffect(()=>{
    //set player properties
    player.isPlaying=preview.isPlaying;
    player.loop=preview.loop;
    player.zoom=preview.zoom;
    player.antialias=preview.antialias;
},[preview]);
useEffect(()=>{
    //set player frames (adding Image object)
    player.frames=frames.map((f,i)=>{
        const img=new Image();
        // img.onload=()=>{
        //     console.log("img loaded",i)
        // }
        img.src=f.url;
        return ({...f,img:img})
    });
    //if currentframeIndex is >= frames length then set currentframeIdx to last index with 0 as min
    if(player.currentFrameIdx>=player.frames.length){
        player.currentFrameIdx=Math.max(player.frames.length-1,0);
    }
},[frames]);

//methods
//images things
function onImportImages(){
    fileInputRef.current.click();
}
function onFileInputChange(){
    let files=Array.from(fileInputRef.current.files);
    //console.log(files);
    const imagesToAdd=files.map((file,i)=>{
        const fileUrl=AppService.fileToUrl(file);
        return {id:AppService.getID(),...file,url:fileUrl,selected:false};
    });
    setImages(prev=>[...prev,...imagesToAdd]);
}
function clearImages(){
    if(confirm("Clear all images?")){
        setImages([]);
    }
}
function selectImage(imgId){
    setImages(prev=>prev.map((img,i)=>img.id===imgId?{...img,selected:!img.selected}:img));
}
function removeSelectedImages(){
    if(confirm("Remove selected images?")){
        setImages(prev=>prev.filter((img,i)=>!img.selected));
    }
}
//frames things
function addFrames(){
    const selectedImages=getSelectedImages();
    if(selectedImages.length>0){
        setFrames(prev=>[...prev,...selectedImages.map((img,i)=>({...img,duration:0.3}))]);
        deselectAllFrames();
    }else{
        alert("Select images to add as frames!");
    }
}
function onSetFrameDuration(frameIdx,newVal){
    const frame=frames[frameIdx];
    const newFrame={...frame,duration:newVal};
    setFrames(prev=>prev.map((f,i)=>i===frameIdx?newFrame:f));
}
function removeFrame(frameIdx){
    setFrames(prev=>prev.filter((f,i)=>i!==frameIdx));
}
function onClearAllFrames(){
    if(confirm("Clear all frames?")){
        setFrames([]);
        setPreview(prev=>({...prev,isPlaying:false}));
    }
}
//player things
function togglePlay(){
    setPreview(prev=>({...prev,isPlaying:!prev.isPlaying}));
}
function togglePlayerLoop(){
    setPreview(prev=>({...prev,loop:!prev.loop}));
}
function onZoom(dir){
    const newval=Math.max(Math.min(preview.zoom+(dir>0?0.05:-0.05),MAX_ZOOM),0);
    setPreview(prev=>({...prev,zoom:newval}));
}
function togglePlayerAA(){
    setPreview(prev=>({...prev,antialias:!prev.antialias}));
}
function togglePlayerBg(){
    setPreview(prev=>({...prev,bg:!prev.bg}));
}
//modals things
//spritesheet slicer
function onOpenSpritesheetSlicer(){
    setLayout(prev=>({...prev,spriteSheetSlicerOn:true}));
}
function onCloseSpritesheetSlicer(){
    setLayout(prev=>({...prev,spriteSheetSlicerOn:false}));
}
function onSpritesheetSlicerImportImages(importedImages){
    //console.log("got images from sss",importedImages);
    const imagesToAdd=importedImages.map((img,i)=>{
        return {id:AppService.getID(),isSlice:true,url:img.src,selected:false};
    });
    setImages(prev=>[...prev,...imagesToAdd]);
}

//helpers
function getSelectedImages(){
    return images.filter((img,i)=>img.selected);
}
function deselectAllFrames(){
    setImages(prev=>prev.map((f,i)=>({...f,selected:false})));
}

//others
function animationToGIF(){
    //const framesImages=frames.map((f,i)=>f.img);console.log(frames)
    if(frames.length<1)return;
    AppService.framesToGIF(frames,preview.antialias).then((val)=>{
        const gifUrl=val;
        //console.log(gifUrl);
        const link=document.createElement('a');
        link.download='gif.gif';
        link.href=gifUrl;
        window.open(link.href,"_blank");
        link.click();
    }).catch(e=>{
        //console.log("ERROR: error creating gif image!",e.toString());
        alert("Error creating GIF image!");
    });
}

return(
<div className="frameAnimationPreviewerContainer w-full min-h-screen flex flex-col">
    <header className="flex items-center justify-center" style={{height:'80px'}}>
        <p className="text-dark font-semibold tracking-wider text-lg">Frame Animation Visualizer</p>
    </header>
    <main className="mainContainer">
        <div className="innerContainer w-full mx-auto px-2 md:px-0" style={{maxWidth:'1280px'}}>
            <p className="text-darker underline text-sm font-semibold mb-2">Images & Preview</p>
            <section className="imagesAndPreviwers flex flex-col md:flex-row">
                <section className="imagesContainer w-full md:w-1/2 border border-semitrans rounded-lg md:mr-1 overflow-hidden grid mb-2" style={{height:isMobile?'360px':'480px',gridAutoRows:'48px minmax(0,auto) 48px'}}>
                    <div className="imagesContainerHeader border-b border-semitrans flex items-center px-2 md:px-4">
                        <p className="text-darker font-semibold text-sm">Images</p>
                    </div>
                    <div className="imagesContainerBody overflow-y-auto">
                        <input ref={fileInputRef} onChange={onFileInputChange} type="file" accept="image/*" multiple hidden />
                        {images.length<1?
                            <div onClick={onImportImages} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:opacity-70">
                                <i className="bi-cloud-arrow-up text-dark text-5xl mb-1"></i>
                                <p className="text-dark tracking-wide text-sm">Import Images</p>
                            </div>
                        :
                            <div className="imagesList w-full p-2 grid grid-cols-3 md:grid-cols-4 gap-2">
                                {
                                    images.map((img,i)=>(
                                        <div key={img.id} onClick={()=>selectImage(img.id)} className={`imageCard border ${img.selected?'border-2 border-primary opacity-80':'border-semitrans'} rounded aspect-square p-2 cursor-pointer hover:opacity-70`}>
                                            <img className="w-full h-full object-contain" src={img.url} />
                                        </div>
                                    ))
                                }
                                <div onClick={onImportImages} className='border border-semitrans rounded aspect-square cursor-pointer flex items-center justify-center hover:opacity-70'>
                                    <i className="bi-plus text-dark text-5xl"></i>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="imagesContainerFooter bg-light border-t border-semitrans flex items-center px-2 md:px-4">
                        {getSelectedImages().length>0&&<button onClick={removeSelectedImages} className="rounded bg-variant text-dark px-4 py-1 text-sm hover:opacity-70"><i className="bi-archive"></i> Remove</button>}
                        {images.length>0&&<button onClick={clearImages} className="ml-auto rounded bg-primary text-lighter px-4 py-1 text-sm hover:opacity-70"><i className="bi-x"></i> Clear</button>}
                    </div>
                </section>
                <section className="previewerContainer w-full md:w-1/2 border border-semitrans rounded-lg md:ml-1 overflow-hidden grid" style={{height:isMobile?'360px':'480px',gridAutoRows:'48px minmax(0,auto) 48px'}}>
                    <div className="previewerContainerHeader border-b border-semitrans flex items-center px-2 md:px-4">
                        <p className="text-darker font-semibold text-sm">Preview</p>
                    </div>
                    <div className={`previewerContainerBody ${preview.bg?'bg-darker':'bg-transparent'}`}>
                        <canvas ref={canRef} id="can" className="border-none border-semitrans" width={canSize.w} height={canSize.h}></canvas>
                    </div>
                    <div className="previewerContainerFooter relative bg-light border-t border-semitrans flex items-center px-2 md:px-4">
                        <ul hidden={!layout.previewContainerConfMenuOn} className="previewContainerConfMenu border border-dark bg-lighter absolute rounded overflow-hidden p-1" style={{left:'10px',bottom:'52px',width:'220px'}}>
                            <li className="py-1">
                                <label className="flex text-dark text-xs md:text-sm font-semibold mr-2" htmlFor="playerBgChk">
                                    bg
                                    <span className="mCheckBox ml-auto"><input type="checkbox" id="playerBgChk" checked={preview.bg} onChange={togglePlayerBg} /><span className="mCheckBoxSlider bg-lightest"></span></span>
                                </label>
                            </li>
                            <li className="py-1">
                                <label className="flex text-dark text-xs md:text-sm font-semibold mr-2" htmlFor="playerLoopChk">
                                    loop
                                    <span className="mCheckBox ml-auto"><input type="checkbox" id="playerLoopChk" checked={preview.loop} onChange={togglePlayerLoop} /><span className="mCheckBoxSlider bg-lightest"></span></span>
                                </label>
                            </li>
                            <li className="py-1">
                                <label className="flex text-dark text-xs md:text-sm font-semibold mr-2" htmlFor="playerAAChk">
                                    antialias
                                    <span className="mCheckBox ml-auto"><input type="checkbox" id="playerAAChk" checked={preview.antialias} onChange={togglePlayerAA} /><span className="mCheckBoxSlider bg-lightest"></span></span>
                                </label>
                            </li>
                        </ul>
                        <button onClick={()=>{setLayout(prev=>({...prev,previewContainerConfMenuOn:!prev.previewContainerConfMenuOn}))}} className="p-1 text-dark"><i className="bi-gear"></i></button>
                        <button onClick={()=>onZoom(-1)} title="Zoom Out" className="w-8 h-8 text-sm rounded mx-1 text-dark rounded-circle hover:opacity-70"><i className="bi-zoom-out"></i></button>
                        <p className="text-xs text-dark font-semibold md:mx-1">{Math.round(preview.zoom*100)}%</p>
                        <button onClick={()=>onZoom(1)} title="Zoom In" className="w-8 h-8 text-sm rounded mx-1 text-dark rounded-circle hover:opacity-70"><i className="bi-zoom-in"></i></button>
                        <button onClick={togglePlay} className="ml-auto rounded bg-primary text-lighter px-4 py-1 text-xs md:text-sm hover:opacity-70"><i className={`${preview.isPlaying?'bi-pause':'bi-play-fill'}`}></i> {preview.isPlaying?'Pause':'Play'}</button>
                    </div>
                </section>
            </section>

            <div className="border-b border-semitrans border-dashed my-6"></div>

            <section className="framesContainer pb-12">
                <div className="flex py-2">
                    <p className="text-darker underline text-sm font-semibold mb-2">Frames</p>
                    <button onClick={onClearAllFrames} className="ml-auto rounded bg-primary text-lighter px-4 py-1 text-sm hover:opacity-70"><i className="bi-x"></i> Clear All</button>
                </div>
                <div className="framesList w-full rounded border border-semitrans overflow-x-auto flex flex-nowrap p-2">
                    {
                        frames.map((frame,i)=>(
                            <div key={i} className="imageCard border border-semitrans rounded overflow-hidden mr-2 flex flex-col shrink-0" style={{width:'168px'}}>
                                <div className="bg-light flex items-center justify-between px-2" style={{height:'40px'}}>
                                    <p className="text-xs text-dark">Frame {i+1}</p>
                                    <button onClick={()=>removeFrame(i)} className="p-1 text-dark hover:opacity-70" title="Remove Frame"><i className="bi-archive"></i></button>
                                </div>
                                <div className="" style={{height:'128px'}}>
                                    <img className="w-full object-contain" src={frame.url} style={{maxHeight:'128px'}} />
                                </div>
                                <div className="bg-light flex items-center justify-between px-1" style={{height:'40px'}}>
                                    <input value={frame.duration} onChange={(e)=>onSetFrameDuration(i,e.target.value)} className="w-full p-1 bg-dark text-lighter text-sm text-center outline-none" placeholder="duration" type="number" step={0.1} />
                                </div>
                            </div>
                        ))
                    }
                    <div onClick={addFrames} className={`plusFrame border border-semitrans rounded flex items-center justify-center ${getSelectedImages().length>0?'cursor-pointer':'cursor-not-allowed'} hover:opacity-70`} title="New Frame" style={{width:'80px',height:'210px'}}>
                        <i className="bi-plus text-5xl text-dark"></i>
                    </div>
                </div>
            </section>
            <ul className="someLinks w-full py-4">
                <li onClick={onOpenSpritesheetSlicer} className="py-2 text-sm text-primary cursor-pointer hover:text-accent underline">Spritesheet Slicer</li>
                {frames.length>0&&<li onClick={animationToGIF} className="py-2 text-sm text-primary cursor-pointer hover:text-accent underline">Download GIF</li>}
            </ul>
        </div>
    </main>
    
    <footer className="flex items-center justify-center mt-auto border-t border-semitrans" style={{height:'128px'}}>
        <p className="text-darkest text-xs font-semibold underline">Frame Animation Visualizer &copy;2023</p>
    </footer>
    {/* //overlay */}
    {(layout.spriteSheetSlicerOn)&&<div className="overlay fixed left-0 top-0 w-screen h-screen bg-semitrans"></div>}
    {/* //modals */}
    {/* //spritesheet slicer modal */}
    {layout.spriteSheetSlicerOn&&<SpritesheetSlicer onClose={onCloseSpritesheetSlicer} onImportImages={onSpritesheetSlicerImportImages} />}
</div>
)
}

export default FrameAnimationPreviewer;