import net from "net";

export function isValidIP(ip: string) {
  return net.isIP(ip) !== 0 && net.isIP(ip) !== 6; // returns 0 invalid, 4 for IPv4, 6 for IPv6
}
