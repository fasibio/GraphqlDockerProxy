
declare module NodeJS  {
  interface Global {
    idx: (obj: any, callBack: (obj: any) => any) => any
    winston: any
  }
}
global.idx = (obj, callBack) => {
  try {
    const res = callBack(obj)
    if (res === undefined) {
      return null
    }
    return res
  } catch (e) {
    return null
  }
}
