import cv2

# https://stackoverflow.com/a/44659589
def image_resize(image, width = None, height = None, inter = cv2.INTER_AREA):
    # initialize the dimensions of the image to be resized and
    # grab the image size
    dim = None
    (h, w) = image.shape[:2]

    # if both the width and height are None, then return the
    # original image
    if width is None and height is None:
        return image

    # check to see if the width is None
    if width is None:
        # calculate the ratio of the height and construct the
        # dimensions
        r = height / float(h)
        dim = (int(w * r), height)

    # otherwise, the height is None
    else:
        # calculate the ratio of the width and construct the
        # dimensions
        r = width / float(w)
        dim = (width, int(h * r))

    # resize the image
    resized = cv2.resize(image, dim, interpolation = inter)

    # return the resized image
    return resized

def image_crop(image, width = None, height = None):
    (h, w) = image.shape[:2]
    if width is None or height is None:
        print('you must give width and height!')
        return image
    if(width > w or height > h):
        print('input must bigger than output!')
        return image
    ystart = (h-height)//2
    xstart = (w-width)//2
    # https://stackoverflow.com/a/15589825
    crop_img = image[ystart:ystart+height, xstart:xstart+width]
    return crop_img

# https://stackoverflow.com/a/33399711
vidcap = cv2.VideoCapture('./videos/test.mp4')
success,image = vidcap.read()
count = 0
while success:
  cv2.imwrite("./result/frames/%d.jpg" % count, image_crop(image_resize(image, 416, 128),416, 128))
  success,image = vidcap.read()
  count += 1

print('done. extract %d frames.', count)
