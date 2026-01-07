/* eslint-disable @typescript-eslint/no-explicit-any */
import { TFunction } from '@/lib/types';
import { useRef, useState } from 'react';

function DropFileInput({onFileChange}: {onFileChange: TFunction}) {

    const wrapperRef = useRef<any>(null);

    const [fileList, setFileList] = useState<any[]>([]);

    const onDragEnter = () => wrapperRef?.current?.classList.add('dragover');

    const onDragLeave = () => wrapperRef?.current?.classList.remove('dragover');

    const onDrop = () => wrapperRef?.current?.classList.remove('dragover');

    const onFileDrop = (e: any) => {
        const newFile: File = e?.target?.files[0];
        if (newFile) {
            const updatedList = [...fileList, newFile];
            setFileList(updatedList);
            onFileChange(updatedList);
        }
    }

    const fileRemove = (file: File) => {
        const updatedList = [...fileList];
        updatedList.splice(fileList.indexOf(file), 1);
        setFileList(updatedList);
        onFileChange(updatedList);
    }

    return (
        <>
            <div
                ref={wrapperRef}
                className="drop-file-input"
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="drop-file-input__label">
                    {/* <img src={"https://media.geeksforgeeks.org/wp-content/uploads/20240308113922/Drag-.png"}
                        alt="" /> */}
                    <p>Drag & Drop your files here</p>
                </div>
                <input type="file" value="" onChange={onFileChange} />
            </div>
            {/* {
                fileList.length > 0 ? (
                    <div className="drop-file-preview">
                        <p className="drop-file-preview__title">
                            Ready to upload
                        </p>
                        {
                            fileList.map((item, index) => (
                                <div key={index} className="drop-file-preview__item">
                                    <div className="drop-file-preview__item__info">
                                        <p>{item.name}</p>
                                        <p>{item.size}B</p>
                                    </div>
                                    <span className="drop-file-preview__item__del"
                                        onClick={() => fileRemove(item)}>
                                        x
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                ) : null
            } */}
        </>
    );
}

export default DropFileInput