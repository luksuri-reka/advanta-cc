'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-dark.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerUIWrapper({ url }: { url: string }) {
    useEffect(() => {
        // Suppress specific React Strict Mode warnings caused by swagger-ui-react
        const originalError = console.error;
        console.error = (...args) => {
            if (
                typeof args[0] === 'string' &&
                (args[0].includes('UNSAFE_componentWillMount') ||
                 args[0].includes('UNSAFE_componentWillReceiveProps') ||
                 args[0].includes('Warning: componentWillMount') ||
                 args[0].includes('Warning: componentWillReceiveProps') ||
                 args[0].includes('Please update the following components: Schemes') ||
                 args[0].includes('Please update the following components: ModelCollapse') ||
                 // swagger-ui-react bug: operationId/tag tidak terdefinisi di API spec
                 (args[0].includes('Encountered two children with the same key') && args[0].includes('undefined.undefined')) ||
                 // PostgREST resolver error: nama kolom view mengandung spasi/karakter khusus
                 args[0].includes('Resolver error') ||
                 args[0].includes('Could not resolve reference'))
            ) {
                return;
            }
            originalError.call(console, ...args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    return <SwaggerUI url={url} />;
}
