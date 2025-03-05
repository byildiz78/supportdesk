"use client"
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

const MobilePage = () => {

    useEffect(() => {   
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loginSuccess',
                userId: "1297"
            }));
        }
    }, []);
    return (
        <div className="w-full min-w-full">
            <div className="w-full min-w-full px-4">
                <Toaster />
            </div>
        </div>
    );
};

export default MobilePage;