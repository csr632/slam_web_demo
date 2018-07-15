import os
import shutil

if __name__ == '__main__':
    dirs = os.listdir('./')
    for d in dirs:
        if os.path.isdir(d):
            print("Start " + d)
            files = os.listdir(d)
            depthPath = d + "/depth/"
            dispPath = d + "/disp/"
            if not os.path.isdir(depthPath):
                os.mkdir(depthPath)
            if not os.path.isdir(dispPath):
                os.mkdir(dispPath)
            for f in files:
                if f.find("depth") != -1:
                    shutil.move(d+"/"+f, depthPath)
                else:
                    shutil.move(d+"/"+f, dispPath)
    
