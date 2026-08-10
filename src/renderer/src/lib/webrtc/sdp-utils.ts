/**
 * Enforces High Bitrate (128kbps) & Stereo in SDP for Opus audio.
 * @param sdp The original SDP string.
 * @returns The modified SDP string.
 */
export const setOpusConfig = (sdp: string): string => {
  const opusLine = sdp.split('\r\n').find((l) => l.indexOf('opus/48000') !== -1)
  if (!opusLine) return sdp

  // Get Payload Type
  const payload = opusLine.split(':')[1].split(' ')[0]

  // Find fmtp line
  const fmtpRegex = new RegExp(`a=fmtp:${payload} (.*)`)
  const fmtpLine = sdp.match(fmtpRegex)

  const config = 'stereo=1;sprop-stereo=1;maxaveragebitrate=128000;cbr=1;useinbandfec=1;dtx=1'

  if (fmtpLine) {
    let params = fmtpLine[1]
    if (!params.includes('stereo=1')) params += ';stereo=1;sprop-stereo=1'
    if (!params.includes('maxaveragebitrate')) params += ';maxaveragebitrate=128000;cbr=1'
    if (!params.includes('useinbandfec')) params += ';useinbandfec=1'
    if (!params.includes('dtx')) params += ';dtx=1'
    return sdp.replace(fmtpRegex, `a=fmtp:${payload} ${params}`)
  } else {
    return sdp.replace(opusLine, `${opusLine}\r\na=fmtp:${payload} ${config}`)
  }
}
