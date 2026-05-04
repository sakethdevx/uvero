import { Navigate } from 'react-router-dom';

const QRGenerator = () => {
    // Redirect to the unified Neural OS QR tool
    return <Navigate to="/qr-tools" replace />;
};

export default QRGenerator;
