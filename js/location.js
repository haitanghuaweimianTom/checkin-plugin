import { CLASSROOM_LOCATION, CHECK_IN_DISTANCE } from './config.js';

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位功能'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = '定位失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '请允许获取位置权限';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置信息不可用';
            break;
          case error.TIMEOUT:
            message = '定位请求超时';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinClassroom(userLat, userLng) {
  const { lat: classLat, lng: classLng } = CLASSROOM_LOCATION;
  const distance = calculateDistance(userLat, userLng, classLat, classLng);
  return {
    distance: Math.round(distance),
    isWithin: distance <= CHECK_IN_DISTANCE
  };
}
