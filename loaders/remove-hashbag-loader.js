module.exports = function(source) {
  console.log('hier')
  return source.replace(/^#! .*\n/, '')
}
