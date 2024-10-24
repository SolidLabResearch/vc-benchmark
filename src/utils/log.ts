import util from "node:util";

export function logv2(obj:any, tag: string|undefined = undefined) {
    if(!!tag)
        console.log(tag, util.inspect(obj,{showHidden: false, depth: null, colors: true}))
    else
        console.log(util.inspect(obj,{showHidden: false, depth: null, colors: true}))

}
