import GIF from 'gif.js';

class AppService{
    static idCounter=0;
    
    //helpers
    static getID(){
        return AppService.idCounter++;
    }
    static fileToUrl(file){
        return URL.createObjectURL(file);
    }
    static async framesToGIF(frames,antialias=true){
        let canvases=[];
        return new Promise((resolve,reject)=>{
            const images=frames.map((f,i)=>{
                const img=new Image();
                img.src=f.url;
                return img;
            });
            console.log(images)
            const gif=new GIF({
                workers:2,
                quality:10,
            });
            images.forEach((image,i)=>{
                const can=document.createElement("canvas");
                canvases.push(can);
                const cc=can.getContext('2d');
                cc.imageSmoothingEnabled=antialias;
                can.width=image.width;
                can.height=image.height;
                cc.drawImage(image,0,0,image.width,image.height);
                gif.addFrame(can,{delay:parseFloat(frames[i].duration)*1000});
            });
            gif.on('finished',function(blob){
                canvases.forEach(canvas=>canvas.remove());
                const url=URL.createObjectURL(blob);
                resolve(url);
            });
            gif.render();
        });
    }

}

export default AppService;
