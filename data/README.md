# Data source 数据来源

[gfs 气象预报](https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl)

通过把数据压缩在 png 图片中，可以大幅度的降低原始数据文件的大小。

# Use 使用

```bash
python ./data/download.py --timestamp 2019111406 --output_dir ./output
```
