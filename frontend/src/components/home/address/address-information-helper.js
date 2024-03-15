export default function transformAddressInformation(address) {
  if (address) {
    if (address.country && !address.country._id) {
      delete address.country;
    }
    if (address.state && !address.state._id) {
      delete address.state;
    }
  }
  return address;
}
