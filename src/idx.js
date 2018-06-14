//@flow


global.idx = (obj, callBack) => {
  try {
    const res = callBack(obj)
    if (res === undefined){
      return null
    }
    return res
  } catch (e){
    return null
  }
}
